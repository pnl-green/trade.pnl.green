 "use client";

import { Box, styled, useMediaQuery } from '@mui/material';
import React, { useCallback, useMemo, useState } from 'react';
import { intelayerColors } from '@/styles/theme';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

const MOBILE_BREAKPOINT = 1024;

const TerminalRoot = styled(Box)(() => ({
  backgroundColor: intelayerColors.page,
  width: '100%',
  minHeight: '100vh',
  padding: '16px clamp(12px, 3vw, 32px) 28px',
  display: 'grid',
  gridTemplateColumns: '1fr',
  gridAutoRows: 'auto',
  rowGap: '16px',
  overflowY: 'auto',
  overflowX: 'hidden',
  '.is-safari &': {
    backgroundColor: '#05070b',
    backgroundImage: 'none',
  },
  [`@media (min-width: ${MOBILE_BREAKPOINT}px)`]: {
    minHeight: 'calc(100vh - 120px)',
    padding: '24px clamp(16px, 3vw, 32px) 32px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
}));

const TopSection = styled('div')(() => ({
  width: '100%',
  minHeight: 'calc(100vh - 140px)',
  display: 'flex',
  flex: '0 0 auto',
  alignItems: 'stretch',
  '.is-safari &': {
    backgroundColor: '#05070b',
    backgroundImage: 'none',
  },
}));

const BottomSection = styled('div')(() => ({
  width: '100%',
  minHeight: '60vh',
  flex: '0 0 auto',
  display: 'flex',
  paddingBottom: '48px',
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

const StackedArea = styled('div')(() => ({
  ...areaStyles,
  height: 'auto',
  width: '100%',
  minHeight: 0,
}));

const createPanel = (defaultSize: number, minSize: number) => ({
  defaultSize,
  minSize,
});

const defaultColumnLayout = [52, 24, 24] as const;

type AreaProps = { children: React.ReactNode; stacked?: boolean };

export const ChartArea: React.FC<AreaProps> = ({ children, stacked }) =>
  stacked ? (
    <StackedArea>{children}</StackedArea>
  ) : (
    <Panel {...createPanel(52, 25)}>
      <AreaWrapper>{children}</AreaWrapper>
    </Panel>
  );

export const OrderbookArea: React.FC<AreaProps> = ({ children, stacked }) =>
  stacked ? (
    <StackedArea>{children}</StackedArea>
  ) : (
    <Panel {...createPanel(24, 15)}>
      <AreaWrapper>{children}</AreaWrapper>
    </Panel>
  );

export const TicketArea: React.FC<AreaProps> = ({ children, stacked }) =>
  stacked ? (
    <StackedArea>{children}</StackedArea>
  ) : (
    <Panel {...createPanel(24, 15)}>
      <AreaWrapper>{children}</AreaWrapper>
    </Panel>
  );

export const BottomArea: React.FC<AreaProps> = ({ children, stacked }) =>
  stacked ? (
    <StackedArea>{children}</StackedArea>
  ) : (
    <Panel {...createPanel(50, 20)}>
      <AreaWrapper>{children}</AreaWrapper>
    </Panel>
  );

export const AssistantArea: React.FC<AreaProps> = ({ children, stacked }) =>
  stacked ? (
    <StackedArea>{children}</StackedArea>
  ) : (
    <Panel {...createPanel(30, 15)}>
      <AreaWrapper>{children}</AreaWrapper>
    </Panel>
  );

export const PortfolioArea: React.FC<AreaProps> = ({ children, stacked }) =>
  stacked ? (
    <StackedArea>{children}</StackedArea>
  ) : (
    <Panel {...createPanel(20, 10)}>
      <AreaWrapper>{children}</AreaWrapper>
    </Panel>
  );

interface TerminalLayoutProps {
  topBar: React.ReactNode;
  children: React.ReactNode;
}

const TerminalLayout: React.FC<TerminalLayoutProps> = ({ topBar, children }) => {
  const [columnLayout, setColumnLayout] = useState<number[]>([...defaultColumnLayout]);
  const isDesktop = useMediaQuery(`(min-width:${MOBILE_BREAKPOINT}px)`);

  const handleColumnLayout = useCallback((sizes: number[]) => {
    setColumnLayout((prev) => {
      if (!prev || prev.length !== sizes.length) {
        return [...sizes];
      }

      const hasChanged = sizes.some((size, index) => Math.abs(size - prev[index]) > 0.1);
      return hasChanged ? [...sizes] : prev;
    });
  }, []);

  const childrenArray = React.Children.toArray(children) as React.ReactElement[];

  const desktopChildren = useMemo(
    () =>
      childrenArray.map((child, index) =>
        React.isValidElement(child)
          ? React.cloneElement(child, { stacked: false, key: `desktop-${index}` })
          : child
      ),
    [childrenArray]
  );

  const stackedChildren = useMemo(() => {
    const mobileOrder = [0, 2, 1, 3, 5, 4];

    return mobileOrder
      .map((index) => childrenArray[index])
      .filter(Boolean)
      .map((child, index) =>
        React.isValidElement(child)
          ? React.cloneElement(child, { stacked: true, key: `stacked-${index}` })
          : child
      );
  }, [childrenArray]);

  const topRowChildren = desktopChildren.slice(0, 3);
  const bottomRowChildren = desktopChildren.slice(3);

  return (
    <TerminalRoot>
      <Box sx={{ width: '100%' }}>{topBar}</Box>
      {isDesktop ? (
        <>
          <TopSection>
            <PanelGroup
              direction="horizontal"
              layout={columnLayout}
              onLayout={handleColumnLayout}
            >
              {topRowChildren.map((child, index) => (
                <React.Fragment key={child.key ?? index}>
                  {child}
                  {index < topRowChildren.length - 1 && <ResizeHandle />}
                </React.Fragment>
              ))}
            </PanelGroup>
          </TopSection>
          <BottomSection>
            <PanelGroup
              direction="horizontal"
              layout={columnLayout}
              onLayout={handleColumnLayout}
            >
              {bottomRowChildren.map((child, index) => (
                <React.Fragment key={child.key ?? index}>
                  {child}
                  {index < bottomRowChildren.length - 1 && <ResizeHandle />}
                </React.Fragment>
              ))}
            </PanelGroup>
          </BottomSection>
        </>
      ) : (
        <StackedLayout>{stackedChildren}</StackedLayout>
      )}
    </TerminalRoot>
  );
};

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

export default TerminalLayout;
