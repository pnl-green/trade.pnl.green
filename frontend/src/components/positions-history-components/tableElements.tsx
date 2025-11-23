import { Box, TableCell, TableContainer, TableRow, styled } from '@mui/material';
import { intelayerColors, intelayerFonts } from '@/styles/theme';

export const TableShell = styled(Box)(() => ({
  width: '100%',
  overflow: 'hidden',
  background: 'transparent',
}));

export const StyledTableContainer = styled(TableContainer)(() => ({
  maxHeight: 300,
  paddingBottom: '60px',
  '&::-webkit-scrollbar': {
    height: '6px',
    width: '6px',
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: intelayerColors.panelBorder,
    borderRadius: '8px',
  },
}));

export const HeaderRow = styled(TableRow)(() => ({
  backgroundColor: intelayerColors.surface,
}));

export const HeaderCell = styled(TableCell)(() => ({
  backgroundColor: intelayerColors.surface,
  color: intelayerColors.subtle,
  fontFamily: intelayerFonts.body,
  fontWeight: 600,
  fontSize: '11px',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  borderBottom: `1px solid ${intelayerColors.panelBorder}`,
  padding: '12px 14px',
  lineHeight: 1.1,
}));

export const BodyRow = styled(TableRow)(() => ({
  transition: 'background-color 0.15s ease',
  '&:hover td': {
    backgroundColor: intelayerColors.gray[700],
  },
}));

export const BodyCell = styled(TableCell)(() => ({
  background: 'transparent',
  color: intelayerColors.ink,
  padding: '12px 14px',
  border: 'none',
  fontFamily: intelayerFonts.body,
  fontSize: '13px',
  fontWeight: 500,
}));

export const EmptyState = styled(Box)(() => ({
  color: intelayerColors.muted,
  fontFamily: intelayerFonts.body,
  fontWeight: 500,
  fontSize: '13px',
  padding: '12px 14px',
}));
