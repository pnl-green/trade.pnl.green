"use client";

import { Box, styled, useMediaQuery } from '@mui/material';
import React, { useCallback, useMemo, useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { intelayerColors } from '@/styles/theme';

const MOBILE_BREAKPOINT = 1024;

const TerminalRoot = styled(Box)(() => ({
  backgroundColor: intelayerColors.page,
  width: '100%',
  minHeight: '100svh',
  padding: '16px clamp(12px, 3vw, 32px) 28px',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  overflowY: 'auto',
  overflowX: 'hidden',
  position: 'relative',
  isolation: 'isolate',
  '.is-safari &': {
    backgroundColor: '#05070b',
    backgroundImage: 'none',
  },
  '@supports (-webkit-touch-callout: none)': {
    minHeight: '-webkit-fill-available',
  },
  [`@media (min-width: ${MOBILE_BREAKPOINT}px)`]: {
    padding: '24px clamp(16px, 3vw, 32px) 32px',
  },
}));

const LayoutBody = styled('div')(() => ({
  flex: '1 1 auto',
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
}));

const TopSection = styled('section')(() => ({
  width: '100%',
  flex: '1 1 auto',
  minHeight: 0,
  display: 'flex',
  alignItems: 'stretch',
  position: 'relative',
  isolation: 'isolate',
}));

const BottomSection = styled('section')(() => ({
  width: '100%',
  flex: '0 0 auto',
  minHeight: '320px',
  display: 'flex',
  paddingBottom: '32px',
  '@media (max-width: 1024px)': {
    minHeight: 'auto',
  },
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

const panelGroupStyle = {
  flex: 1,
  minHeight: 0,
  width: '100%',
  display: 'flex',
} as const;

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
}));

const StackedArea = styled('div')(() => ({
  ...areaStyles,
  height: 'auto',
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
  topBar?: React.ReactNode;
  chart: React.ReactNode;
  orderbook: React.ReactNode;
  ticket: React.ReactNode;
  positions: React.ReactNode;
  assistant: React.ReactNode;
  portfolio: React.ReactNode;
}

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

const TerminalLayout: React.FC<TerminalLayoutProps> = ({
  topBar,
  chart,
  orderbook,
  ticket,
  positions,
  assistant,
  portfolio,
}) => {
  const [columnLayout, setColumnLayout] = useState<number[]>([...defaultColumnLayout]);
  const isDesktop = useMediaQuery(`(min-width:${MOBILE_BREAKPOINT}px)`, { noSsr: true });

  const handleColumnLayout = useCallback((sizes: number[]) => {
    setColumnLayout((prev) => {
      if (!prev || prev.length !== sizes.length) {
        return [...sizes];
      }

      const hasChanged = sizes.some((size, index) => Math.abs(size - prev[index]) > 0.1);
      return hasChanged ? [...sizes] : prev;
    });
  }, []);

  const sections = useMemo(
    () => [
      <ChartArea key="chart">{chart}</ChartArea>,
      <OrderbookArea key="orderbook">{orderbook}</OrderbookArea>,
      <TicketArea key="ticket">{ticket}</TicketArea>,
      <BottomArea key="positions">{positions}</BottomArea>,
      <AssistantArea key="assistant">{assistant}</AssistantArea>,
      <PortfolioArea key="portfolio">{portfolio}</PortfolioArea>,
    ],
    [chart, orderbook, ticket, positions, assistant, portfolio]
  );

  const desktopChildren = useMemo(
    () =>
      sections.map((section, index) =>
        React.isValidElement(section)
          ? React.cloneElement(section, { stacked: false, key: `desktop-${index}` })
          : section
      ),
    [sections]
  );

  const stackedChildren = useMemo(() => {
    const mobileOrder = [0, 2, 1, 3, 5, 4];
    return mobileOrder
      .map((index) => sections[index])
      .filter(Boolean)
      .map((section, index) =>
        React.isValidElement(section)
          ? React.cloneElement(section, { stacked: true, key: `stacked-${index}` })
          : section
      );
  }, [sections]);

  const topRowChildren = desktopChildren.slice(0, 3);
  const bottomRowChildren = desktopChildren.slice(3);

  return (
    <TerminalRoot>
      {topBar && <Box sx={{ width: '100%' }}>{topBar}</Box>}
      <LayoutBody>
        {isDesktop ? (
          <>
            <TopSection>
              <PanelGroup
                direction="horizontal"
                layout={columnLayout}
                onLayout={handleColumnLayout}
                style={panelGroupStyle}
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
                style={panelGroupStyle}
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
      </LayoutBody>
    </TerminalRoot>
  );
};

export default TerminalLayout;
