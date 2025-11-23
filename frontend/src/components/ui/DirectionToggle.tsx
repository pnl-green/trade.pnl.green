import React from 'react';
import { Box, styled } from '@mui/material';
import { intelayerColors, intelayerFonts } from '@/styles/theme';
import { OrderDirection } from '@/context/orderTicketContext';

interface DirectionToggleProps {
  value: OrderDirection;
  onChange: (value: OrderDirection) => void;
}

const ToggleRoot = styled(Box)(() => ({
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '8px',
  width: '100%',
}));

const ToggleButton = styled('button')<{ active: boolean; tone: 'buy' | 'sell' }>(({ active, tone }) => {
  const isSell = tone === 'sell';
  const activeColor = active ? (isSell ? '#FF4444' : intelayerColors.green[500]) : intelayerColors.panelBorder;
  const activeTextColor = active ? (isSell ? '#FF4444' : '#0EF09D') : intelayerColors.muted;
  const activeGlow = active 
    ? (isSell 
        ? '0 0 0 1px #FF4444 inset, 0 6px 20px rgba(255, 68, 68, 0.12)' 
        : '0 0 0 1px #0EF09D inset, 0 6px 20px rgba(14, 240, 157, 0.12)')
    : 'none';
  const hoverColor = isSell ? '#FF4444' : '#0EF09D';

  return {
    border: `1px solid ${activeColor}`,
    borderRadius: '10px',
    padding: '10px 14px',
    background:
      tone === 'buy'
        ? 'linear-gradient(135deg, #1c3b2d 0%, #0f1e18 100%)'
        : 'linear-gradient(135deg, #3c1b1b 0%, #1e0f0f 100%)',
    color: activeTextColor,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    fontFamily: intelayerFonts.heading,
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    position: 'relative',
    boxShadow: activeGlow,
    '&:hover': {
      borderColor: hoverColor,
      color: hoverColor,
    },
  };
});

const DirectionToggle: React.FC<DirectionToggleProps> = ({ value, onChange }) => {
  return (
    <ToggleRoot>
      <ToggleButton active={value === 'buy'} tone="buy" onClick={() => onChange('buy')}>
        Long / Buy
      </ToggleButton>
      <ToggleButton active={value === 'sell'} tone="sell" onClick={() => onChange('sell')}>
        Short / Sell
      </ToggleButton>
    </ToggleRoot>
  );
};

export default DirectionToggle;
