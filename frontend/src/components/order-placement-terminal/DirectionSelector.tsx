"use client";

import { Box } from '@mui/material';
import DirectionToggle from '../ui/DirectionToggle';
import { useOrderTicketContext } from '@/context/orderTicketContext';

const DirectionSelector = () => {
  const { direction, setDirection } = useOrderTicketContext();
  return (
    <Box sx={{ mb: '16px' }}>
      <DirectionToggle value={direction} onChange={setDirection} />
    </Box>
  );
};

export default DirectionSelector;

