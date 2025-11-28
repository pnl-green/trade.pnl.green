import React from 'react';
import { Box, styled } from '@mui/material';
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
  gap: '6px',
  width: '100%',
  flexWrap: 'wrap',
}));

const ControlButton = styled('button')(() => ({
  border: `1px solid ${intelayerColors.panelBorder}`,
  backgroundColor: intelayerColors.surface,
  color: intelayerColors.muted,
  borderRadius: '8px',
  padding: '7px 12px',
  fontFamily: intelayerFonts.body,
  fontSize: '12px',
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

const OrderTypeSelector: React.FC<OrderTypeSelectorProps> = ({
  options,
  value,
  onChange,
}) => {
  return (
    <Box sx={{ width: '100%' }}>
      <ControlRoot role="tablist" aria-label="Order ticket mode">
        {options.map((option) => {
          const button = (
            <ControlButton
              key={option.value}
              type="button"
              role="tab"
              data-active={value === option.value}
              aria-selected={value === option.value}
              onClick={() => onChange(option.value)}
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
        })}
      </ControlRoot>
    </Box>
  );
};

export default OrderTypeSelector;
