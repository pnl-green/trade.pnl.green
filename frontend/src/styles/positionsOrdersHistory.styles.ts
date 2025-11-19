import { Box, styled } from '@mui/material';
import { intelayerColors } from './theme';

export const PositionsOrdersHistoryWrapper = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  borderRadius: '12px',
  border: `1px solid ${intelayerColors.panelBorder}`,
  width: '100%',
  height: '100%',
  minHeight: '304px',
  background: intelayerColors.surface,
  padding: '12px 16px',
  gap: '12px',
}));
