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
}));

const TerminalContainer = styled(PanelGroup)(() => ({
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  flex: 1,
  minHeight: 0,
}));

const TopRow = styled(PanelGroup)(() => ({
  display: 'flex',
  flexDirection: 'row',
  width: '100%',
  height: '100%',
}));

const BottomRow = styled(PanelGroup)(() => ({
  display: 'flex',
  flexDirection: 'row',
  width: '100%',
  height: '100%',
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
  overflow: 'hidden',
} as const;

const AreaWrapper = styled('div')(() => ({
  ...areaStyles,
  height: '100%',
  width: '100%',
}));

const TopRowWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Panel defaultSize={50} minSize={30}>
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', minHeight: 0 }}>
      {children}
    </div>
  </Panel>
);

const BottomRowWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Panel defaultSize={50} minSize={30}>
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%', minHeight: 0 }}>
      {children}
    </div>
  </Panel>
);

export const ChartArea: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Panel defaultSize={40} minSize={20}>
    <AreaWrapper>{children}</AreaWrapper>
  </Panel>
);

export const OrderbookArea: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Panel defaultSize={30} minSize={15}>
    <AreaWrapper>{children}</AreaWrapper>
  </Panel>
);

export const TicketArea: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Panel defaultSize={30} minSize={15}>
    <AreaWrapper>{children}</AreaWrapper>
  </Panel>
);

export const BottomArea: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Panel defaultSize={33.33} minSize={15}>
    <AreaWrapper>{children}</AreaWrapper>
  </Panel>
);

export const AssistantArea: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Panel defaultSize={33.33} minSize={15}>
    <AreaWrapper>{children}</AreaWrapper>
  </Panel>
);

export const PortfolioArea: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Panel defaultSize={33.33} minSize={15}>
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
      <TerminalContainer direction="vertical">
        <TopRowWrapper>
          <TopRow direction="horizontal">
            {topRowChildren.map((child, index) => (
              <React.Fragment key={index}>
                {child}
                {index < topRowChildren.length - 1 && <ResizeHandle />}
              </React.Fragment>
            ))}
          </TopRow>
        </TopRowWrapper>
        <VerticalResizeHandle />
        <BottomRowWrapper>
          <BottomRow direction="horizontal">
            {bottomRowChildren.map((child, index) => (
              <React.Fragment key={index}>
                {child}
                {index < bottomRowChildren.length - 1 && <ResizeHandle />}
              </React.Fragment>
            ))}
          </BottomRow>
        </BottomRowWrapper>
      </TerminalContainer>
    </TerminalRoot>
  );
};

export default TerminalLayout;
