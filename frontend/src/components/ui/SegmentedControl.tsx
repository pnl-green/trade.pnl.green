'use client';

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
  centered?: boolean;
}

const ControlRoot = styled('div')<{ centered?: boolean }>(({ centered }) => ({
  display: 'flex',
  gap: '6px',
  width: centered ? 'auto' : '100%',
  flexWrap: 'wrap',
  justifyContent: centered ? 'center' : 'flex-start',
}));

const ControlButton = styled('button')<{ centered?: boolean }>(({ centered }) => ({
  border: `1px solid ${intelayerColors.panelBorder}`,
  backgroundColor: intelayerColors.gray[700],
  color: intelayerColors.ink,
  borderRadius: '10px',
  padding: '7px 12px',
  fontFamily: intelayerFonts.body,
  fontSize: '12px',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'background-color 0.2s ease, color 0.2s ease, border 0.2s ease',
  flex: centered ? '0 1 auto' : '1 1 auto',
  textAlign: 'center',
  minWidth: centered ? 'auto' : '0',
  boxShadow: '0 1px 2px rgba(0,0,0,0.35)',
  '&:hover': {
    backgroundColor: intelayerColors.gray[600],
  },
  '&[data-active="true"]': {
    backgroundColor: intelayerColors.green[600],
    color: intelayerColors.page,
    borderColor: intelayerColors.green[400],
    boxShadow: '0 0 0 1px rgba(4, 146, 96, 0.4)',
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
  centered = false,
}) => {
  return (
    <ControlRoot role="tablist" aria-label={ariaLabel} centered={centered}>
      {options.map((option) => {
        const button = (
          <ControlButton
            key={option.value}
            type="button"
            role="tab"
            data-active={value === option.value}
            aria-selected={value === option.value}
            onClick={() => onChange(option.value)}
            centered={centered}
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
