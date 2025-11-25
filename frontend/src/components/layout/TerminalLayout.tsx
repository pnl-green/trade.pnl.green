"use client";

import { styled } from '@mui/material';
import React from 'react';
import { intelayerColors } from '@/styles/theme';

interface TerminalLayoutProps {
  topBar?: React.ReactNode;
  chart: React.ReactNode;
  orderbook: React.ReactNode;
  ticket: React.ReactNode;
  positions: React.ReactNode;
  assistant: React.ReactNode;
  portfolio: React.ReactNode;
}

const TerminalPage = styled('div')(() => ({
  width: '100%',
  minHeight: '100%',
  background: 'linear-gradient(180deg, #070a0f 0%, #0b0f17 100%)',
  color: intelayerColors.ink,
  padding: '16px clamp(12px, 3vw, 28px) 28px',
}));

const Content = styled('div')(() => ({
  maxWidth: '1680px',
  margin: '0 auto',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
}));

const HeaderBar = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  padding: '14px 18px',
  borderRadius: '16px',
  backgroundColor: '#0d1118',
  border: '1px solid rgba(255, 255, 255, 0.05)',
  boxShadow: '0 10px 32px rgba(0, 0, 0, 0.22)',
  minHeight: 0,
}));

const TerminalGrid = styled('div')(() => ({
  display: 'grid',
  gap: '16px',
  gridTemplateColumns: '2.4fr 1fr 1fr',
  gridTemplateAreas: `
    "chart orderbook ticket"
    "positions assistant portfolio"
  `,
  alignItems: 'stretch',
  width: '100%',
  minHeight: 0,
  '@media (max-width: 1199px)': {
    gridTemplateColumns: '1.3fr 1fr',
    gridTemplateAreas: `
      "chart chart"
      "positions ticket"
      "positions orderbook"
      "positions portfolio"
      "positions assistant"
    `,
  },
  '@media (max-width: 767px)': {
    gridTemplateColumns: '1fr',
    gridTemplateAreas: `
      "chart"
      "ticket"
      "orderbook"
      "positions"
      "portfolio"
      "assistant"
    `,
  },
}));

const PanelSection = styled('section', {
  shouldForwardProp: (prop) => prop !== 'area',
})<{ area: string }>(({ area }) => ({
  gridArea: area,
  minWidth: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
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
  return (
    <TerminalPage>
      <Content>
        {topBar && <HeaderBar>{topBar}</HeaderBar>}
        <TerminalGrid>
          <PanelSection area="chart">{chart}</PanelSection>
          <PanelSection area="orderbook">{orderbook}</PanelSection>
          <PanelSection area="ticket">{ticket}</PanelSection>
          <PanelSection area="positions">{positions}</PanelSection>
          <PanelSection area="assistant">{assistant}</PanelSection>
          <PanelSection area="portfolio">{portfolio}</PanelSection>
        </TerminalGrid>
      </Content>
    </TerminalPage>
  );
};

export default TerminalLayout;
