 "use client";

import { Box, styled } from '@mui/material';
import React from 'react';
import { intelayerColors } from '@/styles/theme';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

const TerminalRoot = styled(Box)(() => ({
  backgroundColor: intelayerColors.page,
  width: '100%',
  minHeight: 'calc(100vh - 120px)',
  padding: '24px clamp(16px, 3vw, 32px) 32px',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  overflow: 'hidden',
}));

const TopSection = styled('div')(() => ({
  width: '100%',
  height: 'calc(100vh - 140px)',
  minHeight: 'calc(100vh - 140px)',
  display: 'flex',
}));

const BottomSection = styled('div')(() => ({
  width: '100%',
  minHeight: '60vh',
  display: 'flex',
}));

const ResizeHandle = styled(PanelResizeHandle)(() => ({
  width: '4px',
  backgroundColor: intelayerColors.panelBorder,
  cursor: 'col-resize',
  transition: 'background-color 0.2s ease',
  '&:hover': {
    backgroundColor: intelayerColors.green[500],
  },
}));

const VerticalResizeHandle = styled(PanelResizeHandle)(() => ({
  width: '100%',
  height: '4px',
  backgroundColor: intelayerColors.panelBorder,
  cursor: 'row-resize',
  transition: 'background-color 0.2s ease',
  '&:hover': {
    backgroundColor: intelayerColors.green[500],
  },
}));

const areaStyles = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  minHeight: 0,
  height: '100%',
  minWidth: 0,
  overflow: 'visible',
} as const;

const AreaWrapper = styled('div')(() => ({
  ...areaStyles,
  height: '100%',
  width: '100%',
}));

const createPanel = (defaultSize: number, minSize: number) => ({
  defaultSize,
  minSize,
});

export const ChartArea: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Panel {...createPanel(52, 25)}>
    <AreaWrapper>{children}</AreaWrapper>
  </Panel>
);

export const OrderbookArea: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Panel {...createPanel(24, 15)}>
    <AreaWrapper>{children}</AreaWrapper>
  </Panel>
);

export const TicketArea: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Panel {...createPanel(24, 15)}>
    <AreaWrapper>{children}</AreaWrapper>
  </Panel>
);

export const BottomArea: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Panel {...createPanel(50, 20)}>
    <AreaWrapper>{children}</AreaWrapper>
  </Panel>
);

export const AssistantArea: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Panel {...createPanel(30, 15)}>
    <AreaWrapper>{children}</AreaWrapper>
  </Panel>
);

export const PortfolioArea: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Panel {...createPanel(20, 10)}>
    <AreaWrapper>{children}</AreaWrapper>
  </Panel>
);

interface TerminalLayoutProps {
  topBar: React.ReactNode;
  children: React.ReactNode;
}

const TerminalLayout: React.FC<TerminalLayoutProps> = ({ topBar, children }) => {
  const childrenArray = React.Children.toArray(children);
  const topRowChildren = childrenArray.slice(0, 3);
  const bottomRowChildren = childrenArray.slice(3);

  return (
    <TerminalRoot>
      <Box sx={{ width: '100%' }}>{topBar}</Box>
      <TopSection>
        <PanelGroup direction="horizontal">
          {topRowChildren.map((child, index) => (
            <React.Fragment key={index}>
              {child}
              {index < topRowChildren.length - 1 && <ResizeHandle />}
            </React.Fragment>
          ))}
        </PanelGroup>
      </TopSection>
      <BottomSection>
        <PanelGroup direction="horizontal">
          {bottomRowChildren.map((child, index) => (
            <React.Fragment key={index}>
              {child}
              {index < bottomRowChildren.length - 1 && <ResizeHandle />}
            </React.Fragment>
          ))}
        </PanelGroup>
      </BottomSection>
    </TerminalRoot>
  );
};

export default TerminalLayout;
