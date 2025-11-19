import { Box, styled } from '@mui/material';
import React from 'react';
import { intelayerColors } from '@/styles/theme';

const TerminalRoot = styled(Box)(() => ({
  backgroundColor: intelayerColors.page,
  width: '100%',
  minHeight: 'calc(100vh - 120px)',
  padding: '24px clamp(16px, 3vw, 32px) 32px',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
}));

const TerminalGrid = styled('div')(() => ({
  display: 'grid',
  gridTemplateColumns: '2.3fr 1.1fr 1.1fr',
  gridTemplateRows: 'minmax(400px, 1fr) minmax(280px, 0.4fr)',
  gridTemplateAreas: `"chart orderbook ticket" "bottom bottom ticket"`,
  gap: '16px',
  width: '100%',
  flex: 1,
  minHeight: 0,
  '@media (max-width: 1200px)': {
    gridTemplateColumns: '1.6fr 1fr',
    gridTemplateAreas: `"chart chart" "orderbook ticket" "bottom bottom"`,
    gridTemplateRows: 'auto auto auto',
  },
  '@media (max-width: 900px)': {
    gridTemplateColumns: '1fr',
    gridTemplateAreas: `"chart" "orderbook" "ticket" "bottom"`,
  },
}));

const areaStyles = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  minHeight: 0,
};

export const ChartArea = styled('div')(() => ({
  ...areaStyles,
  gridArea: 'chart',
}));

export const OrderbookArea = styled('div')(() => ({
  ...areaStyles,
  gridArea: 'orderbook',
}));

export const TicketArea = styled('div')(() => ({
  ...areaStyles,
  gridArea: 'ticket',
}));

export const BottomArea = styled('div')(() => ({
  ...areaStyles,
  gridArea: 'bottom',
}));

interface TerminalLayoutProps {
  topBar: React.ReactNode;
  children: React.ReactNode;
}

const TerminalLayout: React.FC<TerminalLayoutProps> = ({ topBar, children }) => {
  return (
    <TerminalRoot>
      <Box sx={{ width: '100%' }}>{topBar}</Box>
      <TerminalGrid>{children}</TerminalGrid>
    </TerminalRoot>
  );
};

export default TerminalLayout;
