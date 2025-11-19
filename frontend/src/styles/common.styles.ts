import { Box, Button, Typography, styled } from '@mui/material';
import { intelayerColors, intelayerFonts } from './theme';

export const ItemsSelect = styled('select')(() => ({
  height: '36px',
  padding: '6px 10px',
  borderRadius: '8px',
  backgroundColor: intelayerColors.surface,
  color: intelayerColors.ink,
  border: `1px solid ${intelayerColors.panelBorder}`,
  cursor: 'pointer',
  fontFamily: intelayerFonts.body,
  fontSize: '13px',
}));

//buttons
export const TextBtn = styled(Button)(() => ({
  color: intelayerColors.ink,
  backgroundColor: 'transparent',
  textTransform: 'none',
  fontFamily: intelayerFonts.body,
  position: 'relative',
}));

export const GreenBtn = styled(Button)(() => ({
  color: '#04140B',
  backgroundColor: intelayerColors.green[600],
  textTransform: 'none',
  fontFamily: intelayerFonts.body,

  '&:hover': {
    backgroundColor: intelayerColors.green[500],
  },
}));

export const OutlinedBtn = styled(Button)(() => ({
  color: intelayerColors.green[500],
  backgroundColor: 'transparent',
  textTransform: 'none',
  fontFamily: intelayerFonts.body,
  border: `1px solid ${intelayerColors.green[500]}`,

  '&:hover': {
    backgroundColor: 'rgba(21, 211, 128, 0.1)',
  },
}));

export const ButtonStyles = {
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'space-evenly',
  width: '100%',
  position: 'absolute',
  bottom: '142px',
};

export const BuySellBtn = styled(Button)(() => ({
  color: intelayerColors.ink,
  backgroundColor: intelayerColors.surface,
  textTransform: 'none',
  fontFamily: intelayerFonts.body,
  padding: '8px 12px !important',
  borderRadius: '10px',
  '&.buyBtn': {
    backgroundColor: intelayerColors.green[600],
    color: '#04140B',
  },

  '&.sellBtn': {
    backgroundColor: intelayerColors.red[500],
  },
}));

export const CurrentMarketPriceWidget = styled(Box)(() => ({
  display: "flex",
  flexDirection: "column"
}))

export const CurrentMarketPriceAsk = styled(Typography)(() => ({
  fontSize: "12px",
  color: "red"
}))

export const CurrentMarketPriceBid = styled(Typography)(() => ({
  fontSize: "12px",
  color: "lime"
}))

//flex items
export const FlexItems = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  span: {
    fontSize: '13px',
    fontWeight: 500,
    fontFamily: intelayerFonts.body,
  },
}));

export const TabsButtons = styled(Button)(() => ({
  minWidth: 'fit-content',
  minHeight: '33px',
  borderRadius: '10px',
  backgroundColor: intelayerColors.surface,
  textTransform: 'none',
  color: intelayerColors.muted,
  fontSize: '13px',
  fontWeight: 600,
  fontFamily: intelayerFonts.body,
  transition: 'all 0.2s ease-in-out',

  '&:hover': {
    backgroundColor: intelayerColors.gray[700],
    color: intelayerColors.ink,
  },
  '&.active': {
    backgroundColor: intelayerColors.green[600],
    color: '#04140B',
  },
}));

export const BlurContainer = styled('div')(() => ({}));

export const ComingSoonText = styled('div')(() => ({}));
