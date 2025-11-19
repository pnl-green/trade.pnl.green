import React from 'react';
import { styled } from '@mui/material';
import { intelayerColors, intelayerFonts } from '@/styles/theme';
import Tooltip from './Tooltip';

interface SegmentedControlOption {
  label: string;
  value: string;
  tooltip?: string;
}

interface SegmentedControlProps {
  options: SegmentedControlOption[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
}

const ControlRoot = styled('div')(() => ({
  display: 'flex',
  gap: '8px',
  width: '100%',
  flexWrap: 'wrap',
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
  flex: '1 1 auto',
  textAlign: 'center',
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

const SegmentedControl: React.FC<SegmentedControlProps> = ({
  options,
  value,
  onChange,
  ariaLabel,
}) => {
  return (
    <ControlRoot role="tablist" aria-label={ariaLabel}>
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
  );
};

export default SegmentedControl;
