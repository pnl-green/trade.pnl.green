import { Box, styled } from '@mui/material';
import { intelayerColors, intelayerFonts } from './theme';

interface TablerowsProps {
  type?: string;
  width?: string | number;
  side?: string;
  fontSize?: string;
}

export const OrderBookContainer = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  height: '100%',
  minHeight: 0,
}));

export const OrderBookTabsWrapper = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  width: '100%',
  position: 'relative',
}));

export const OrderBookTabs = styled(Box)(() => ({
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '12px',
  width: '100%',
  position: 'relative',
  button: {
    border: 'none',
    background: 'transparent',
    color: intelayerColors.muted,
    fontFamily: intelayerFonts.heading,
    fontSize: '15px',
    fontWeight: 500,
    padding: '8px 0',
    cursor: 'pointer',
    position: 'relative',
    transition: 'color 0.2s ease',
    '&[data-active="true"]': {
      color: intelayerColors.green[500],
    },
  },
}));

export const OrderBookTabsHighlight = styled('span')(() => ({
  position: 'absolute',
  bottom: 0,
  left: 0,
  height: '2px',
  width: '50%',
  background: intelayerColors.green[500],
  transition: 'transform 0.25s ease',
  transform: 'translateX(0%)',
  '&[data-active="trades"]': {
    transform: 'translateX(100%)',
  },
}));

export const SpreadAndPairSelects = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'space-between',
  gap: '12px',
  width: '100%',
  flexWrap: 'wrap',
}));

export const StyledTable = styled('table')<TablerowsProps>((props) => ({
  width: '100%',
  borderCollapse: 'collapse',
  fontFamily: intelayerFonts.body,
  fontSize: props.fontSize ? props.fontSize : '12px',
  thead: {
    color: intelayerColors.subtle,
    fontSize: props.fontSize ? props.fontSize : '12px',
    fontWeight: 500,
    fontFamily: intelayerFonts.body,
    width: '100%',
    textAlign: 'left',
    th: {
      padding: '6px 8px',
    },
  },
  th: {
    padding: '6px 8px',
  },
  td: {
    position: 'relative',
    padding: '6px 8px',
  },
  tbody: {
    textAlign: 'left',
    fontSize: props.fontSize ? props.fontSize : '11px',
    fontWeight: 500,
    fontFamily: intelayerFonts.body,
    color: intelayerColors.ink,
  },
  tr: {
    position: 'relative',

    '&:hover': {
      backgroundColor: 'rgba(20, 26, 35, 0.6)',
      cursor: 'pointer',
    },
  },
}));

export const Tablerows = styled('tr')<TablerowsProps>(() => ({}));

export const TradesRows = styled('tr')<TablerowsProps>((props) => ({
  '.first-column': {
    color: props.side === 'A' ? intelayerColors.green[500] : intelayerColors.red[500],
  },
  '.details-icon': {
    padding: '4px 8px 4px 5px',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: 'rgba(21, 211, 128, 0.1)',
    },
    img: {
      width: '15px',
      height: '15px',
    },
  },
}));
