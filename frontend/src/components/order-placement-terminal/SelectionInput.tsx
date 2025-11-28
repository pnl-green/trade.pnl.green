import { styled } from '@mui/material';
import { intelayerColors } from '@/styles/theme';

const SelectionInput = styled('input')(() => ({
  width: '14px',
  height: '14px',
  accentColor: intelayerColors.green[500],
  cursor: 'pointer',
  margin: 0,
}));

export default SelectionInput;
