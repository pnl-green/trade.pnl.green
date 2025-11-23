import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Menu, MenuItem, MenuList, Typography, styled } from '@mui/material';
import { intelayerColors, intelayerFonts } from '@/styles/theme';
import Tooltip from '../ui/Tooltip';

interface SegmentedControlOption {
  label: string;
  value: string;
  tooltip?: string;
}

interface OrderTypeSelectorProps {
  options: SegmentedControlOption[];
  value: string;
  onChange: (value: string) => void;
}

const ControlRoot = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  width: '100%',
  flexWrap: 'nowrap',
  overflow: 'hidden',
}));

const ControlButton = styled('button')(() => ({
  border: `1px solid ${intelayerColors.panelBorder}`,
  backgroundColor: intelayerColors.surface,
  color: intelayerColors.muted,
  borderRadius: '8px',
  padding: '8px 14px',
  fontFamily: intelayerFonts.body,
  fontSize: '13px',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'background-color 0.2s ease, color 0.2s ease, border 0.2s ease',
  flex: '0 0 auto',
  textAlign: 'center',
  minWidth: 0,
  whiteSpace: 'nowrap',
  '&[data-active="true"]': {
    backgroundColor: intelayerColors.green[600],
    color: '#04140B',
    borderColor: intelayerColors.green[500],
  },
  '&:focus-visible': {
    outline: `2px solid ${intelayerColors.green[500]}`,
    outlineOffset: '2px',
  },
}));

const MoreButton = styled(ControlButton)(() => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  paddingRight: '12px',
  paddingLeft: '12px',
}));

const OverflowMenu = styled(Menu)(() => ({
  '.MuiPaper-root': {
    backgroundColor: intelayerColors.surface,
    border: `1px solid ${intelayerColors.panelBorder}`,
    borderRadius: '10px',
    boxShadow: '0px 10px 24px rgba(0, 0, 0, 0.35)',
    minWidth: '160px',
  },
}));

const OverflowItem = styled(MenuItem)(() => ({
  fontFamily: intelayerFonts.body,
  fontSize: '13px',
  color: intelayerColors.ink,
  '&[data-active="true"]': {
    backgroundColor: 'rgba(21, 211, 128, 0.1)',
    color: intelayerColors.green[400],
  },
}));

const PERSISTED_TYPES = ['Market', 'Limit'];

const OrderTypeSelector: React.FC<OrderTypeSelectorProps> = ({
  options,
  value,
  onChange,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const moreButtonRef = useRef<HTMLButtonElement | null>(null);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [visibleValues, setVisibleValues] = useState<string[]>(() =>
    options.map((option) => option.value)
  );
  const [overflowValues, setOverflowValues] = useState<string[]>([]);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  const optionLookup = useMemo(
    () => Object.fromEntries(options.map((option) => [option.value, option])),
    [options]
  );

  const overflowActive = overflowValues.includes(value);

  const measureAndArrange = () => {
    const containerWidth = containerRef.current?.clientWidth || 0;
    if (!containerWidth) return;

    const gap = 8;
    const moreWidth = moreButtonRef.current?.offsetWidth || 80;
    const pinned = options.filter((option) => PERSISTED_TYPES.includes(option.value));
    const others = options.filter((option) => !PERSISTED_TYPES.includes(option.value));

    let usedWidth = 0;
    const nextVisible: string[] = [];
    const nextOverflow: string[] = [];

    pinned.forEach((option, index) => {
      const buttonWidth = buttonRefs.current[option.value]?.offsetWidth || 0;
      usedWidth += buttonWidth + (index > 0 ? gap : 0);
      nextVisible.push(option.value);
    });

    for (let index = 0; index < others.length; index += 1) {
      const option = others[index];
      const buttonWidth = buttonRefs.current[option.value]?.offsetWidth || 0;
      const hasRemaining = others.length - index - 1 > 0;
      const needsDropdown = nextOverflow.length > 0 || hasRemaining;
      const projectedWidth =
        usedWidth + gap + buttonWidth + (needsDropdown ? gap + moreWidth : 0);

      if (projectedWidth <= containerWidth) {
        usedWidth += gap + buttonWidth;
        nextVisible.push(option.value);
      } else {
        nextOverflow.push(option.value, ...others.slice(index + 1).map((item) => item.value));
        break;
      }
    }

    setVisibleValues(nextVisible);
    setOverflowValues(nextOverflow);
  };

  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return undefined;

    const resizeObserver = new ResizeObserver(() => {
      measureAndArrange();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    setVisibleValues(options.map((option) => option.value));
    setOverflowValues([]);
    const timer = requestAnimationFrame(measureAndArrange);
    return () => cancelAnimationFrame(timer);
  }, [options]);

  const handleSelect = (selected: string) => {
    onChange(selected);
    setMenuAnchor(null);
  };

  const renderButton = (option: SegmentedControlOption) => {
    const button = (
      <ControlButton
        key={option.value}
        type="button"
        role="tab"
        ref={(node) => {
          buttonRefs.current[option.value] = node;
        }}
        data-active={value === option.value}
        aria-selected={value === option.value}
        onClick={() => handleSelect(option.value)}
      >
        {option.label}
      </ControlButton>
    );

    return option.tooltip ? (
      <Tooltip key={option.value} content={option.tooltip}>
        {button}
      </Tooltip>
    ) : (
      button
    );
  };

  return (
    <Box ref={containerRef} sx={{ width: '100%' }}>
      <ControlRoot role="tablist" aria-label="Order ticket mode">
        {visibleValues.map((valueKey) =>
          renderButton(optionLookup[valueKey] || { label: valueKey, value: valueKey })
        )}
        {overflowValues.length > 0 && (
          <MoreButton
            ref={moreButtonRef}
            type="button"
            role="tab"
            data-active={overflowActive}
            aria-haspopup="true"
            aria-expanded={Boolean(menuAnchor)}
            onClick={(event) => setMenuAnchor(event.currentTarget)}
          >
            <Typography component="span" sx={{ fontWeight: 600 }}>
              More
            </Typography>
            <Typography component="span" sx={{ fontWeight: 600 }}>
              ▾
            </Typography>
          </MoreButton>
        )}
      </ControlRoot>

      <OverflowMenu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuList disablePadding>
          {overflowValues.map((overflowValue) => {
            const option = optionLookup[overflowValue];
            return (
              <OverflowItem
                key={overflowValue}
                data-active={overflowValue === value}
                onClick={() => handleSelect(overflowValue)}
              >
                {option?.label || overflowValue}
              </OverflowItem>
            );
          })}
        </MenuList>
      </OverflowMenu>
    </Box>
  );
};

export default OrderTypeSelector;
