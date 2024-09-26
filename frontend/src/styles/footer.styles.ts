import { Box, styled } from '@mui/material';

export const FooterContainer = styled(Box)(() => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '20px 30px',
  backgroundColor: '#000',
  border: '2px solid rgba(255, 255, 255, 0.1)',
  textAlign: 'center',
  fontSize: '13px',
  fontWeight: '300',
  a: {
    padding: '0 5px',
    textDecoration: 'none',
  }
}));
