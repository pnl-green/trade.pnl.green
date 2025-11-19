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
  gap: '8px',
  paddingBottom: '8px',
  borderBottom: `1px solid ${intelayerColors.panelBorder}`,
  overflowX: 'auto',
}));

const TabButton = styled('button')(() => ({
  background: 'transparent',
  border: 'none',
  color: intelayerColors.muted,
  fontFamily: intelayerFonts.body,
  fontSize: '13px',
  fontWeight: 500,
  padding: '6px 10px',
  borderRadius: '8px',
  cursor: 'pointer',
  transition: 'background 0.2s ease, color 0.2s ease',
  '&[data-active="true"]': {
    color: intelayerColors.ink,
    backgroundColor: intelayerColors.gray[700],
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
