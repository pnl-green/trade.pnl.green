import { Box, Button, styled } from '@mui/material';
import { intelayerColors, intelayerFonts } from './theme';

export const TradingViewComponent = styled(Box)(() => ({
  display: 'flex',
  width: '100%',
  height: '100%',
  borderRadius: '12px',
  overflow: 'hidden',
  backgroundColor: intelayerColors.surface,
  border: `1px solid ${intelayerColors.panelBorder}`,
  '> div': {
    width: '100%',
    height: '100%',
    iframe: {
      border: 'none',
      width: '100%',
      height: '100%',
      backgroundColor: intelayerColors.surface,
    },
  },
}));

export const ChatBox = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  width: '100%',
  minHeight: '280px',
  height: '100%',
  '.header_nav': {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '8px',
  },
  header: {
    fontFamily: intelayerFonts.heading,
    fontSize: '15px',
    fontWeight: 500,
    color: intelayerColors.ink,
  },
  '.chat_room': {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    flex: 1,
    minHeight: 0,
  },
  '.chat_messages': {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    overflowY: 'auto',
    flex: 1,
    padding: '4px 2px 4px 0',
  },
  '.chat_input': {
    display: 'flex',
    borderRadius: '10px',
    alignItems: 'center',
    border: `1px solid ${intelayerColors.panelBorder}`,
    padding: '0 12px',
    height: '40px',
    backgroundColor: intelayerColors.surface,
    input: {
      flex: 1,
      border: 'none',
      outline: 'none',
      background: 'transparent',
      color: intelayerColors.ink,
      fontFamily: intelayerFonts.body,
      fontSize: '14px',
    },
  },
  '.send_bubble': {
    alignSelf: 'flex-end',
    backgroundColor: intelayerColors.green[600],
    color: '#04140B',
    padding: '6px 10px',
    borderRadius: '10px',
    fontFamily: intelayerFonts.body,
    fontSize: '13px',
  },
  '.received_bubble': {
    alignSelf: 'flex-start',
    backgroundColor: intelayerColors.gray[700],
    color: intelayerColors.ink,
    padding: '6px 10px',
    borderRadius: '10px',
    fontFamily: intelayerFonts.body,
    fontSize: '13px',
  },
}));

export const BtnWithIcon = styled(Button)(() => ({
  padding: 0,
  minWidth: '36px',
  height: '36px',
  borderRadius: '8px',
  backgroundColor: intelayerColors.green[600],
  '&:hover': {
    backgroundColor: intelayerColors.green[500],
  },
}));
