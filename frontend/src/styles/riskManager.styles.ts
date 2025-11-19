import { Box, Checkbox, Radio, styled } from '@mui/material';
import { intelayerColors, intelayerFonts } from './theme';

export const RiskManagerWrapper = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  width: '100%',
  minHeight: '680px',
  height: '100%',
  padding: '4px',
  position: 'relative',
}));

export const LiquidationWrapper = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
  padding: '20px 10px',
  borderTop: `1px solid ${intelayerColors.panelBorder}`,
  // position: "absolute",
  // bottom: "0",
  width: '100%',
  height: '135px',
  // left: "0",

  '.items': {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',

    fontSize: '14px',
    fontWeight: 500,
    fontFamily: intelayerFonts.body,
    color: intelayerColors.ink,
  },
}));

export const SelectItemsBox = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'space-between',
  gap: '10px',
  width: '100%',
  height: '46px',
  borderRadius: '10px',
  background: intelayerColors.gray[700],
  marginTop: '10px',
  alignItems: 'center',
  padding: '0 10px 0 10px',
  border: `1px solid transparent`,
  '*': {
    fontSize: '13px',
    fontWeight: 500,
    fontFamily: intelayerFonts.body,
    color: intelayerColors.ink,
  },
  input: {
    border: 'none',
    outline: 'none',
    background: 'transparent',
    width: '100%',
    height: '100%',
    color: intelayerColors.ink,
    paddingLeft: '10px',
    // cursor: "",

    '&:hover': {
      outline: `1px solid ${intelayerColors.panelBorder}`,
      borderRadius: '8px',
    },
  },

  'input::placeholder': {
    color: intelayerColors.muted,
  },

  '&:hover': {
    border: `1px solid ${intelayerColors.panelBorder}`,
    borderRadius: '8px',
  },

  span: { fontSize: '12px' },
}));

export const InputBox = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'space-between',
  gap: '10px',
  width: '100%',
  height: '35px',
  borderRadius: '8px',
  background: intelayerColors.gray[700],
  border: `1px solid transparent`,
  alignItems: 'center',
  padding: '0 10px 0 5px',

  '*': {
    fontSize: '13px',
    fontWeight: 500,
    fontFamily: intelayerFonts.body,
    color: intelayerColors.ink,
  },

  '.placeholder_box': {
    width: '60%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },

  input: {
    border: 'none',
    outline: 'none',
    background: 'transparent',
    width: '50%',
    height: '100%',
    color: intelayerColors.ink,
    paddingLeft: '10px',
    justifyContent: 'flex-end',
    textAlign: 'right',

    '&:hover': {
      outline: 'none !important',
      border: 'none !important',
    },
  },

  'input::placeholder': {
    color: `${intelayerColors.muted} !important`,
  },

  '&:hover': {
    border: `1px solid ${intelayerColors.panelBorder}`,
  },
}));

export const CaptionsBtn = styled(Box)({
  display: 'flex',
  padding: '5px',
  background: '#34484D',
  borderRadius: '5px',
  fontSize: '14px',
  fontWeight: '400',
  fontFamily: 'Sora',
  cursor: 'pointer',
  height: '33px',
  width: '124px',
  alignItems: 'center',
  justifyContent: 'center',
});
