import React from 'react';
import { styled } from '@mui/material';
import { intelayerColors, intelayerFonts } from '@/styles/theme';
import Tooltip from './Tooltip';

interface BottomTab {
  label: string;
  value: string;
  tooltip: string;
}

interface BottomTabsProps {
  tabs: BottomTab[];
  active: string;
  onChange: (value: string) => void;
}

const TabsRoot = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '0 2px 6px',
  borderBottom: `1px solid ${intelayerColors.panelBorder}`,
  overflowX: 'auto',
}));

const TabButton = styled('button')(() => ({
  position: 'relative',
  background: 'transparent',
  border: 'none',
  color: intelayerColors.muted,
  fontFamily: intelayerFonts.body,
  fontSize: '13px',
  fontWeight: 600,
  padding: '10px 8px 12px',
  borderRadius: '10px',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  transition: 'background 0.2s ease, color 0.2s ease',
  '&::after': {
    content: '""',
    position: 'absolute',
    left: '50%',
    bottom: '4px',
    width: '18px',
    height: '2px',
    borderRadius: '999px',
    background: intelayerColors.green[500],
    transform: 'translateX(-50%) scaleX(0)',
    transition: 'transform 0.2s ease',
  },
  '&:hover': {
    color: intelayerColors.ink,
    backgroundColor: intelayerColors.gray[700],
  },
  '&[data-active="true"]': {
    color: intelayerColors.ink,
    '&::after': {
      transform: 'translateX(-50%) scaleX(1)',
    },
  },
  '&:focus-visible': {
    outline: `2px solid ${intelayerColors.green[500]}`,
    outlineOffset: '2px',
  },
}));

const BottomTabs: React.FC<BottomTabsProps> = ({ tabs, active, onChange }) => {
  return (
    <TabsRoot role="tablist">
      {tabs.map((tab) => (
        <Tooltip key={tab.value} content={tab.tooltip}>
          <TabButton
            type="button"
            role="tab"
            data-active={tab.value === active}
            aria-selected={tab.value === active}
            onClick={() => onChange(tab.value)}
          >
            {tab.label}
          </TabButton>
        </Tooltip>
      ))}
    </TabsRoot>
  );
};

export default BottomTabs;
