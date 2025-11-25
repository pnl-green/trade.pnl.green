"use client";

import { Box, Button, styled, useMediaQuery } from '@mui/material';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { intelayerColors, intelayerFonts } from '@/styles/theme';

const MOBILE_BREAKPOINT = 1024;
const GRID_COLS = 12;
const GRID_ROW_HEIGHT = 36;
const GRID_GAP = 16;
const LAYOUT_STORAGE_KEY = 'pnl_terminal_layout_v2';

type PanelId =
  | 'chart'
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

const defaultLayout: PanelLayout[] = [
  { i: 'chart', x: 0, y: 0, w: 6, h: 12, minW: 4, minH: 8 },
  { i: 'orderbook', x: 6, y: 0, w: 3, h: 12, minW: 3, minH: 6 },
  { i: 'ticket', x: 9, y: 0, w: 3, h: 12, minW: 3, minH: 8 },
  { i: 'positions', x: 0, y: 12, w: 6, h: 10, minW: 4, minH: 6 },
  { i: 'assistant', x: 6, y: 12, w: 3, h: 10, minW: 3, minH: 6 },
  { i: 'portfolio', x: 9, y: 12, w: 3, h: 10, minW: 3, minH: 4 },
];

const TerminalRoot = styled(Box)(() => ({
  backgroundColor: intelayerColors.page,
  width: '100%',
  minHeight: '100svh',
  padding: '16px clamp(12px, 3vw, 32px) 28px',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
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
    padding: '24px clamp(16px, 3vw, 32px) 32px',
  },
}));

const LayoutBody = styled('div')(() => ({
  flex: '1 1 auto',
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
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

const ResizeHandle = styled('span')(() => ({
  position: 'absolute',
  width: '12px',
  height: '12px',
  right: '4px',
  bottom: '4px',
  borderRadius: '3px',
  background: `linear-gradient(135deg, ${intelayerColors.panelBorder}, ${intelayerColors.green[600]})`,
  cursor: 'nwse-resize',
  opacity: 0.9,
  boxShadow: '0 0 0 1px rgba(255,255,255,0.12)',
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
    };

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const resolveCollisions = (layout: PanelLayout[], movingId: PanelId): PanelLayout[] => {
  const items = [...layout];
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

  const sorted = items
    .filter((item) => item.i !== movingId)
    .sort((a, b) => a.y - b.y || a.x - b.x);

  sorted.forEach((item) => {
    let current = { ...item };
    while (collide(current, moving)) {
      current = { ...current, y: moving.y + moving.h };
    }
    Object.assign(item, current);
  });

  return [moving, ...sorted].sort((a, b) => a.y - b.y || a.x - b.x);
};

const loadLayout = (): PanelLayout[] => {
  if (typeof window === 'undefined') return defaultLayout;
  const saved = localStorage.getItem(LAYOUT_STORAGE_KEY);
  if (!saved) return defaultLayout;
  try {
    const parsed = JSON.parse(saved) as PanelLayout[];
    if (Array.isArray(parsed) && parsed.every((item) => item.i && item.w && item.h)) {
      return parsed;
    }
  } catch (error) {
    console.error('Failed to parse stored layout', error);
  }
  return defaultLayout;
};

const TerminalLayout: React.FC<TerminalLayoutProps> = ({
  topBar,
  chart,
  orderbook,
  ticket,
  positions,
  assistant,
  portfolio,
}) => {
  const [layout, setLayout] = useState<PanelLayout[]>(defaultLayout);
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
          nextItem.w = clamp(nextItem.w + deltaW, minW, GRID_COLS - nextItem.x);
          nextItem.h = clamp(nextItem.h + deltaH, minH, nextItem.h + 20);
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
    (id: PanelId, type: DragState['type']) =>
      (event: React.PointerEvent<HTMLDivElement | HTMLSpanElement>) => {
        if (!isDesktop) return;
        const current = layout.find((item) => item.i === id);
        if (!current) return;
        dragState.current = {
          type,
          id,
          startX: event.clientX,
          startY: event.clientY,
          origin: { ...current },
        };
      },
    [isDesktop, layout]
  );

  const resetLayout = () => {
    saveLayout(defaultLayout);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LAYOUT_STORAGE_KEY);
    }
  };

  const sections = useMemo(
    () => ({
      chart,
      orderbook,
      ticket,
      positions,
      assistant,
      portfolio,
    }),
    [chart, orderbook, ticket, positions, assistant, portfolio]
  );

  const orderedLayout = useMemo(
    () => [...layout].sort((a, b) => a.y - b.y || a.x - b.x),
    [layout]
  );

  const stackedOrder: PanelId[] = ['chart', 'ticket', 'orderbook', 'positions', 'assistant', 'portfolio'];

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
        {isDesktop && (
          <Button
            variant="outlined"
            size="small"
            onClick={resetLayout}
            sx={{
              color: intelayerColors.subtle,
              borderColor: intelayerColors.panelBorder,
              fontFamily: intelayerFonts.body,
              textTransform: 'none',
              '&:hover': {
                borderColor: intelayerColors.green[500],
                color: intelayerColors.green[500],
              },
            }}
          >
            Reset layout
          </Button>
        )}
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
                <ResizeHandle onPointerDown={startInteraction(item.i, 'resize')} />
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
