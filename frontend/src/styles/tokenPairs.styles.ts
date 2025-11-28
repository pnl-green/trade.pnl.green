import { Box, styled } from '@mui/material';
import { intelayerColors, intelayerFonts } from './theme';

interface TokenPairsProps {
  tableISOpen?: boolean;
}

export const TokenPairsWrapper = styled(Box)<TokenPairsProps>(({ tableISOpen }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: '4px 8px',
  width: '100%',
  minHeight: '32px',
  borderRadius: '10px',
  backgroundColor: intelayerColors.surface,
  gap: '8px',
  border: `1px solid ${intelayerColors.panelBorder}`,
  flexWrap: 'nowrap',

  '.pair-section': {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    minWidth: '80px',
    maxWidth: '140px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontFamily: intelayerFonts.heading,
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
  },

  '.pair-symbol': {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
  },

  '.metrics': {
    display: 'flex',
    alignItems: 'stretch',
    gap: '8px',
    justifyContent: 'space-between',
    flexWrap: 'nowrap',
    flex: 1,
    minWidth: 0,
  },

  '.upDownIcon': {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    transform: tableISOpen ? 'rotate(0)' : 'rotate(180deg)',
    transition: 'transform 0.3s ease-in-out',
    img: {
      width: '12px',
    },
  },

  '.metric': {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: '4px',
    minWidth: '88px',
    flex: 1,
    padding: '2px 2px',
    overflow: 'hidden',

    '.label': {
      display: 'flex',
      flexDirection: 'column',
      fontFamily: intelayerFonts.body,
      fontSize: '10.5px',
      fontWeight: 600,
      color: intelayerColors.subtle,
    },

    '.sublabel': {
      fontSize: '10px',
      fontWeight: 500,
      color: intelayerColors.muted,
    },

    '#toRed': {
      color: intelayerColors.red[400],
    },

    '#toGreen': {
      color: intelayerColors.green[400],
    },

    '.value': {
      color: intelayerColors.ink,
      fontSize: '12px',
      fontWeight: 600,
      fontFamily: intelayerFonts.body,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
  },
  '@media (max-width: 768px)': {
    gap: '12px',
    padding: '10px 14px',
    flexWrap: 'wrap',
  },
}));

export const TokenPairsInfoTableWrapper = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  width: '694px',
  height: '348px',
  background: intelayerColors.surface,
  borderRadius: '12px',
  border: `1px solid ${intelayerColors.panelBorder}`,
  position: 'absolute',
  zIndex: 10,
  top: 'calc(100% + 8px)',
  left: '0',
  padding: '12px',

  '*': {
    fontFamily: intelayerFonts.body,
    fontSize: '12px',
    fontWeight: 500,
  },

  input: {
    width: '100%',
    minHeight: '35px',
    borderRadius: '8px',
    backgroundColor: 'transparent',
    border: `1px solid ${intelayerColors.panelBorder}`,
    color: intelayerColors.ink,
    padding: '0 10px',

    '&::placeholder': {
      color: intelayerColors.muted,
    },
  },

  '@media (max-width: 899px)': {
    width: 'calc(100vw - 20px)',
    marginLeft: '-8px',
  },
}));

export const TokenTableTabsWrapper = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'row',
  gap: '20px',
  width: '100%',
  minHeight: '30px',
  paddingBottom: '1px',

  overflowX: 'auto',
  overflowY: 'hidden',

  button: {
    border: 'none',
    backgroundColor: 'transparent',
    color: '#FFFFFF9C',
    cursor: 'pointer',
    fontWeight: '600',
    minWidth: 'fit-content',

    '&:hover': {
      color: '#049260',
    },

    '&.active': {
      color: '#049260',
    },
  },
  '@media (max-width: 599px)': {
    cursor: 'auto',
    //webkit scroll height 5px
    '&::-webkit-scrollbar': {
      // height: "5px",
      display: 'none',
    },
  },
}));

export const PairTableContainer = styled('table')(() => ({
  width: '100%',
  borderCollapse: 'collapse',
  marginTop: '8px',

  thead: {
    color: '#FFFFFF99',
    fontSize: '13px',
    fontWeight: '400',
    fontFamily: 'Sora',
    width: '100%',
    textAlign: 'left',

    th: {
      minWidth: '20px',
    },
  },

  tbody: {
    tr: {
      position: 'relative',
      '&:hover': {
        backgroundColor: '#0F1A1F',
        cursor: 'pointer',
      },
    },

    td: {
      padding: '5px 0px',
    },

    '#centered-content': {
      display: 'flex',
      alignItems: 'center',
    },
  },

  '.favButton': {
    marginRight: '5px',
  },

  '& .greenBox': {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#049260',
    width: '32px',
    height: '20px',
    padding: '1px',
    borderRadius: '4px',
    marginLeft: '5px',
  },

  '@media (max-Width: 694px)': {
    width: '690px',
  },
}));
