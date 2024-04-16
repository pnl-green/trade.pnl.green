import { Box, styled } from '@mui/material';

export const NavbarContainer = styled(Box)(() => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px 30px',
  width: '100vw',
  // height: "70px",
  backgroundColor: '#000',
  position: 'sticky',
  zIndex: 100,

  '.logo': {
    cursor: 'pointer',
    img: {
      width: '120px',
      height: '27px',
    },
  },

  '.external-links': {
    display: 'flex',
    flexDirection: 'row',
    gap: '10px',
  },

  '.user-config': {
    display: 'flex',
    flexDirection: 'row',
    gap: '40px',
    alignItems: 'center',
    '*': {
      cursor: 'pointer',
    },
  },
  '.user-icon': {
    width: '29px',
    height: '19px',
  },

  '.settings-icon': {
    width: '25px',
    height: '22px',
  },
  '.more-icon': {
    width: '22px',
    height: '22px',
  },
}));

export const SettingsModalWrapper = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  padding: '0px',
  position: 'absolute',
  top: 'calc(100% + 15px)',
  right: '0',
  width: '290px',
  zIndex: 10,
  // boxShadow: "0 0 4px rgba(255, 255, 255, 0.5)",
  cursor: 'default !important',

  '.innerBox': {
    display: 'flex',
    flexDirection: 'column',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '5px',
    padding: '20px',
    gap: '10px',
    cursor: 'default !important',
    background: '#000',
  },

  '.settingItems': {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',

    ':nth-last-of-type(2)': {
      paddingBottom: '10px',
      borderBottom: '1px solid #FFFFFF75',
    },
  },

  label: {
    fontFamily: 'Sora',
    fontSize: '13px',
    color: '#FFFFFF75',
    cursor: 'default !important',
  },

  span: {
    color: '#049260',
    cursor: 'pointer',
  },
}));

//checkBox
export const StyledCheckBox = styled(Box)(() => ({
  '& input[type="checkbox"]': {
    appearance: 'none',
    '-webkit-appearance': 'none',
    '-moz-appearance': 'none',
    width: '12px',
    height: '12px',
    border: 'none',
    borderRadius: '1px',
    outline: '1px solid #ccc',
    cursor: 'pointer',
    outlineOffset: '2px',
    paddingTop: '2px',

    '&:checked': {
      backgroundColor: '#049260',
      outline: '1px solid #049260',
      border: 'none',
    },
  },
}));
