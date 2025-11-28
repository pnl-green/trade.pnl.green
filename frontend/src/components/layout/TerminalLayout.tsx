"use client";

import { Box, styled, useMediaQuery } from '@mui/material';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { intelayerColors } from '@/styles/theme';

const MOBILE_BREAKPOINT = 1024;

const BASE_GRID_COLS = 12;
const BASE_GRID_ROW_HEIGHT = 36;
const BASE_GRID_GAP = 12;

// Increase the grid resolution to reduce the perception of snapping during drag.
// Layout values (x/y/w/h) are stored in higher-precision units derived from the
// base grid to keep panel sizes consistent while allowing smaller resize steps.
const GRID_MULTIPLIER = 6;
const GRID_COLS = BASE_GRID_COLS * GRID_MULTIPLIER;
const GRID_ROW_HEIGHT = Math.max(6, Math.round(BASE_GRID_ROW_HEIGHT / GRID_MULTIPLIER));
const GRID_GAP = Math.max(2, Math.round(BASE_GRID_GAP / GRID_MULTIPLIER));
export const LAYOUT_STORAGE_KEY = 'pnl_terminal_layout_v3';
const RESIZE_HITBOX = 10;

type PanelId =
  | 'chart'
  | 'assetInfo'
  | 'orderbook'
  | 'ticket'
  | 'positions'
  | 'assistant'
  | 'portfolio';

type PanelLayout = {
  i: PanelId;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
};

type ResizeDirection =
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

const scaleLayout = (layout: PanelLayout[], factor: number): PanelLayout[] =>
  layout.map((item) => ({
    ...item,
    x: item.x * factor,
    y: item.y * factor,
    w: item.w * factor,
    h: item.h * factor,
    minW: (item.minW ?? 1) * factor,
    minH: (item.minH ?? 1) * factor,
  }));

const baseLayout: PanelLayout[] = [
  { i: 'assetInfo', x: 0, y: 0, w: 7, h: 2, minW: 6, minH: 2 },
  { i: 'chart', x: 0, y: 2, w: 7, h: 18, minW: 6, minH: 12 },
  { i: 'orderbook', x: 7, y: 0, w: 2, h: 16, minW: 2, minH: 8 },
  { i: 'ticket', x: 9, y: 0, w: 3, h: 18, minW: 2, minH: 12 },
  { i: 'positions', x: 0, y: 22, w: 6, h: 10, minW: 4, minH: 6 },
  { i: 'assistant', x: 6, y: 22, w: 3, h: 10, minW: 2, minH: 6 },
  { i: 'portfolio', x: 9, y: 22, w: 3, h: 10, minW: 2, minH: 4 },
];

const defaultLayout: PanelLayout[] = scaleLayout(baseLayout, GRID_MULTIPLIER);

const cloneLayout = (layout: PanelLayout[]): PanelLayout[] =>
  layout.map((item) => ({ ...item }));

const ensureDefaultPanels = (layout: PanelLayout[]): PanelLayout[] => {
  const existing = new Set(layout.map((item) => item.i));
  const missing = defaultLayout.filter((item) => !existing.has(item.i));
  return [...layout, ...missing.map((item) => ({ ...item }))];
};

const TerminalRoot = styled(Box)(() => ({
  backgroundColor: intelayerColors.page,
  width: '100%',
  minHeight: '100svh',
  padding: '10px clamp(6px, 1.4vw, 18px) 18px',
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  overflowY: 'auto',
  overflowX: 'hidden',
  position: 'relative',
  isolation: 'isolate',
  '.is-safari &': {
    backgroundColor: '#05070b',
    backgroundImage: 'none',
  },
  '@supports (-webkit-touch-callout: none)': {
    minHeight: '-webkit-fill-available',
  },
  [`@media (min-width: ${MOBILE_BREAKPOINT}px)`]: {
    padding: '16px clamp(10px, 1.8vw, 22px) 22px',
  },
}));

const LayoutBody = styled('div')(() => ({
  flex: '1 1 auto',
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
}));

const DesktopGrid = styled('div')(() => ({
  width: '100%',
  flex: '1 1 auto',
  minHeight: 0,
  display: 'grid',
  gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))`,
  gridAutoRows: `${GRID_ROW_HEIGHT}px`,
  gap: `${GRID_GAP}px`,
  alignContent: 'start',
  position: 'relative',
}));

const GridItem = styled('div')(() => ({
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
  minWidth: 0,
  position: 'relative',
  cursor: 'grab',
  transition: 'box-shadow 0.2s ease',
  '&:active': {
    cursor: 'grabbing',
  },
}));

const StackedLayout = styled('div')(() => ({
  display: 'grid',
  gridTemplateColumns: '1fr',
  gridAutoRows: 'auto',
  rowGap: '16px',
  width: '100%',
  '& > *': {
    width: '100%',
    minWidth: 0,
  },
}));

interface TerminalLayoutProps {
  topBar?: React.ReactNode;
  assetInfo: React.ReactNode;
  chart: React.ReactNode;
  orderbook: React.ReactNode;
  ticket: React.ReactNode;
  positions: React.ReactNode;
  assistant: React.ReactNode;
  portfolio: React.ReactNode;
}

type DragState =
  | null
  | {
      type: 'move' | 'resize';
      id: PanelId;
      startX: number;
      startY: number;
      origin: PanelLayout;
      direction?: ResizeDirection;
    };

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const resolveCollisions = (layout: PanelLayout[], movingId: PanelId): PanelLayout[] => {
  const items = cloneLayout(layout);
  const moving = items.find((item) => item.i === movingId);
  if (!moving) return layout;

  const collide = (a: PanelLayout, b: PanelLayout) => {
    const noOverlap =
      a.x + a.w <= b.x ||
      b.x + b.w <= a.x ||
      a.y + a.h <= b.y ||
      b.y + b.h <= a.y;
    return !noOverlap;
  };

  const enforceBounds = (item: PanelLayout) => {
    const minW = item.minW ?? 1;
    const minH = item.minH ?? 1;
    const maxX = GRID_COLS - minW;
    const nextX = clamp(item.x, 0, maxX);
    const nextW = clamp(item.w, minW, GRID_COLS - nextX);
    const nextY = Math.max(0, item.y);
    return { ...item, x: nextX, w: nextW, y: nextY, h: Math.max(minH, item.h) };
  };

  const pushItem = (item: PanelLayout, target: PanelLayout) => {
    const overlapX =
      Math.min(item.x + item.w, target.x + target.w) - Math.max(item.x, target.x);
    const overlapY =
      Math.min(item.y + item.h, target.y + target.h) - Math.max(item.y, target.y);
    if (overlapX <= 0 || overlapY <= 0) return item;

    const itemMinW = item.minW ?? 1;
    const itemMinH = item.minH ?? 1;
    const targetCenterX = target.x + target.w / 2;
    const targetCenterY = target.y + target.h / 2;
    const itemCenterX = item.x + item.w / 2;
    const itemCenterY = item.y + item.h / 2;

    const attemptHorizontal = overlapX <= overlapY;

    const tryPushHorizontal = () => {
      const pushRight = itemCenterX >= targetCenterX;
      if (pushRight) {
        const newX = target.x + target.w;
        const availableWidth = GRID_COLS - newX;
        const newW = clamp(item.w, itemMinW, availableWidth);
        if (availableWidth >= itemMinW) {
          return enforceBounds({ ...item, x: newX, w: newW });
        }
      } else {
        const newX = Math.max(0, target.x - item.w);
        const rightBound = newX + item.w;
        if (rightBound > target.x) {
          const adjustedWidth = clamp(target.x - newX, itemMinW, GRID_COLS - newX);
          if (adjustedWidth >= itemMinW) {
            return enforceBounds({ ...item, x: newX, w: adjustedWidth });
          }
        } else {
          return enforceBounds({ ...item, x: newX });
        }
      }
      return null;
    };

    const tryPushVertical = () => {
      const pushDown = itemCenterY >= targetCenterY;
      if (pushDown) {
        const newY = target.y + target.h;
        return enforceBounds({ ...item, y: newY });
      }
      const availableHeight = target.y - item.y;
      if (availableHeight >= itemMinH) {
        return enforceBounds({ ...item, h: availableHeight });
      }
      return null;
    };

    const horizontalFirst = attemptHorizontal ? [tryPushHorizontal, tryPushVertical] : [tryPushVertical, tryPushHorizontal];
    for (const resolver of horizontalFirst) {
      const next = resolver();
      if (next) return next;
    }
    return enforceBounds(item);
  };

  let iterations = 0;
  let changed = true;
  while (changed && iterations < 20) {
    changed = false;
    iterations += 1;
    for (let idx = 0; idx < items.length; idx += 1) {
      const item = items[idx];
      if (item.i === movingId) continue;
      if (!collide(item, moving)) continue;
      const pushed = pushItem(item, moving);
      if (
        pushed.x !== item.x ||
        pushed.y !== item.y ||
        pushed.w !== item.w ||
        pushed.h !== item.h
      ) {
        items[idx] = pushed;
        changed = true;
      }
    }
  }

  return items.sort((a, b) => a.y - b.y || a.x - b.x);
};

const loadLayout = (): PanelLayout[] => {
  if (typeof window === 'undefined') return cloneLayout(defaultLayout);
  const saved = localStorage.getItem(LAYOUT_STORAGE_KEY);
  if (!saved) return cloneLayout(defaultLayout);
  try {
    const parsed = JSON.parse(saved) as PanelLayout[];
    if (Array.isArray(parsed) && parsed.every((item) => item.i && item.w && item.h)) {
      const needsScaling = parsed.some((item) => item.w <= BASE_GRID_COLS && item.h <= baseLayout[0].h);
      const normalized = needsScaling ? scaleLayout(parsed, GRID_MULTIPLIER) : parsed;
      return cloneLayout(ensureDefaultPanels(normalized));
    }
  } catch (error) {
    console.error('Failed to parse stored layout', error);
  }
  return cloneLayout(defaultLayout);
};

const TerminalLayout: React.FC<TerminalLayoutProps> = ({
  topBar,
  chart,
  assetInfo,
  orderbook,
  ticket,
  positions,
  assistant,
  portfolio,
}) => {
  const [layout, setLayout] = useState<PanelLayout[]>(cloneLayout(defaultLayout));
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const dragState = useRef<DragState>(null);

  const isDesktop = useMediaQuery(`(min-width:${MOBILE_BREAKPOINT}px)`, { noSsr: true });

  useEffect(() => {
    if (!isDesktop) return;
    setLayout(loadLayout());
  }, [isDesktop]);

  const saveLayout = useCallback((next: PanelLayout[]) => {
    setLayout(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(next));
    }
  }, []);

  useEffect(() => {
    if (!gridRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry?.contentRect?.width) return;
      setContainerWidth(entry.contentRect.width);
    });
    observer.observe(gridRef.current);
    return () => observer.disconnect();
  }, []);

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      const state = dragState.current;
      if (!state || !gridRef.current || !isDesktop) return;
      const colWidth =
        (containerWidth - GRID_GAP * (GRID_COLS - 1)) / (GRID_COLS <= 0 ? 1 : GRID_COLS);
      const dx = event.clientX - state.startX;
      const dy = event.clientY - state.startY;

      if (!colWidth) return;

      saveLayout((prevLayout) => {
        const current = prevLayout.find((item) => item.i === state.id);
        if (!current) return prevLayout;

        const base = { ...state.origin };
        let nextItem = { ...current };

        if (state.type === 'move') {
          const proposedX = Math.round(base.x + dx / (colWidth + GRID_GAP));
          const proposedY = Math.round(base.y + dy / (GRID_ROW_HEIGHT + GRID_GAP));
          nextItem.x = clamp(proposedX, 0, GRID_COLS - nextItem.w);
          nextItem.y = Math.max(0, proposedY);
        } else {
          const deltaW = Math.round(dx / (colWidth + GRID_GAP));
          const deltaH = Math.round(dy / (GRID_ROW_HEIGHT + GRID_GAP));
          const minW = nextItem.minW ?? 1;
          const minH = nextItem.minH ?? 1;

          const resizeLeft = state.direction?.includes('left');
          const resizeRight = state.direction?.includes('right');
          const resizeTop = state.direction?.includes('top');
          const resizeBottom = state.direction?.includes('bottom');

          let nextX = base.x;
          let nextY = base.y;
          let nextW = base.w;
          let nextH = base.h;

          if (resizeLeft) {
            const proposedX = clamp(base.x + deltaW, 0, base.x + base.w - minW);
            nextX = proposedX;
            nextW = clamp(base.w + (base.x - proposedX), minW, GRID_COLS - proposedX);
          } else if (resizeRight) {
            const maxWidth = GRID_COLS - base.x;
            nextW = clamp(base.w + deltaW, minW, maxWidth);
          }

          if (resizeTop) {
            const proposedY = clamp(base.y + deltaH, 0, base.y + base.h - minH);
            nextY = proposedY;
            nextH = Math.max(minH, base.h + (base.y - proposedY));
          } else if (resizeBottom) {
            nextH = Math.max(minH, base.h + deltaH);
          }

          nextItem = { ...nextItem, x: nextX, y: nextY, w: nextW, h: nextH };
        }

        const updated = prevLayout.map((item) => (item.i === state.id ? nextItem : item));
        return resolveCollisions(updated, state.id);
      });
    },
    [containerWidth, isDesktop, saveLayout]
  );

  const handlePointerUp = useCallback(() => {
    if (dragState.current) {
      dragState.current = null;
    }
  }, []);

  useEffect(() => {
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  const startInteraction = useCallback(
    (
      id: PanelId,
      type: DragState['type'],
      direction?: ResizeDirection,
      stopPropagation?: boolean
    ) =>
      (event: React.PointerEvent<HTMLDivElement | HTMLSpanElement>) => {
        if (!isDesktop) return;
        if (stopPropagation) {
          event.stopPropagation();
          event.preventDefault();
        }
        const current = layout.find((item) => item.i === id);
        if (!current) return;
        dragState.current = {
          type,
          id,
          startX: event.clientX,
          startY: event.clientY,
          origin: { ...current },
          direction,
        };
      },
    [isDesktop, layout]
  );

  const resetLayout = useCallback(() => {
    const freshDefault = cloneLayout(defaultLayout);
    saveLayout(freshDefault);
    if (typeof window !== 'undefined') {
      localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(freshDefault));
    }
  }, [saveLayout]);

  useEffect(() => {
    const handleReset = () => resetLayout();
    window.addEventListener('pnl-reset-layout', handleReset);
    return () => window.removeEventListener('pnl-reset-layout', handleReset);
  }, [resetLayout]);

  const sections = useMemo(
    () => ({
      chart,
      assetInfo,
      orderbook,
      ticket,
      positions,
      assistant,
      portfolio,
    }),
    [assetInfo, chart, orderbook, ticket, positions, assistant, portfolio]
  );

  const resizeHandles = useMemo(
    () => [
      {
        key: 'top',
        direction: 'top' as const,
        sx: {
          top: 0,
          left: RESIZE_HITBOX,
          right: RESIZE_HITBOX,
          height: RESIZE_HITBOX,
          cursor: 'ns-resize',
        },
      },
      {
        key: 'bottom',
        direction: 'bottom' as const,
        sx: {
          bottom: 0,
          left: RESIZE_HITBOX,
          right: RESIZE_HITBOX,
          height: RESIZE_HITBOX,
          cursor: 'ns-resize',
        },
      },
      {
        key: 'left',
        direction: 'left' as const,
        sx: {
          top: RESIZE_HITBOX,
          bottom: RESIZE_HITBOX,
          left: 0,
          width: RESIZE_HITBOX,
          cursor: 'ew-resize',
        },
      },
      {
        key: 'right',
        direction: 'right' as const,
        sx: {
          top: RESIZE_HITBOX,
          bottom: RESIZE_HITBOX,
          right: 0,
          width: RESIZE_HITBOX,
          cursor: 'ew-resize',
        },
      },
      {
        key: 'top-left',
        direction: 'top-left' as const,
        sx: {
          top: 0,
          left: 0,
          width: RESIZE_HITBOX,
          height: RESIZE_HITBOX,
          cursor: 'nwse-resize',
        },
      },
      {
        key: 'top-right',
        direction: 'top-right' as const,
        sx: {
          top: 0,
          right: 0,
          width: RESIZE_HITBOX,
          height: RESIZE_HITBOX,
          cursor: 'nesw-resize',
        },
      },
      {
        key: 'bottom-left',
        direction: 'bottom-left' as const,
        sx: {
          bottom: 0,
          left: 0,
          width: RESIZE_HITBOX,
          height: RESIZE_HITBOX,
          cursor: 'nesw-resize',
        },
      },
      {
        key: 'bottom-right',
        direction: 'bottom-right' as const,
        sx: {
          bottom: 0,
          right: 0,
          width: RESIZE_HITBOX,
          height: RESIZE_HITBOX,
          cursor: 'nwse-resize',
        },
      },
    ],
    []
  );

  const orderedLayout = useMemo(
    () => [...layout].sort((a, b) => a.y - b.y || a.x - b.x),
    [layout]
  );

  const stackedOrder: PanelId[] = [
    'assetInfo',
    'chart',
    'ticket',
    'orderbook',
    'positions',
    'assistant',
    'portfolio',
  ];

  return (
    <TerminalRoot>
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
        {topBar && <Box sx={{ flex: 1, minWidth: 0 }}>{topBar}</Box>}
      </Box>
      <LayoutBody>
        {isDesktop ? (
          <DesktopGrid ref={gridRef}>
            {orderedLayout.map((item) => (
              <GridItem
                key={item.i}
                style={{
                  gridColumn: `${item.x + 1} / span ${item.w}`,
                  gridRow: `${item.y + 1} / span ${item.h}`,
                  cursor: dragState.current?.id === item.i ? 'grabbing' : 'grab',
                }}
                onPointerDown={startInteraction(item.i, 'move')}
              >
                <Box sx={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                  {sections[item.i]}
                </Box>
                {resizeHandles.map((handle) => (
                  <Box
                    key={handle.key}
                    sx={{ position: 'absolute', zIndex: 2, ...handle.sx }}
                    onPointerDown={startInteraction(item.i, 'resize', handle.direction, true)}
                  />
                ))}
              </GridItem>
            ))}
          </DesktopGrid>
        ) : (
          <StackedLayout>
            {stackedOrder.map((id) => (
              <Box key={id} sx={{ minHeight: 0 }}>
                {sections[id]}
              </Box>
            ))}
          </StackedLayout>
        )}
      </LayoutBody>
    </TerminalRoot>
  );
};

export default TerminalLayout;
