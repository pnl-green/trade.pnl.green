import React from 'react';
import { LiquidationWrapper } from '@/styles/riskManager.styles';
import { Box } from '@mui/material';
import Tooltip from '../ui/Tooltip';

interface LiquidationContentProps {
  liquidationPrice?: number;
  orderValue?: number;
  marginRequired?: number;
  fees?: number;
}

const LiquidationContent: React.FC<LiquidationContentProps> = ({
  liquidationPrice,
  orderValue,
  marginRequired,
  fees,
}) => {
  return (
    <LiquidationWrapper sx={{ position: 'absolute', bottom: 0 }}>
      <Box className="items">
        <Tooltip content="Liquidation Price is the approximate price at which the venue may force close your position due to insufficient margin.">
          <span>Liquidation Price</span>
        </Tooltip>
        <span>{liquidationPrice ? liquidationPrice : 'N/A'}</span>
      </Box>
      <Box className="items">
        <Tooltip content="Order Value is the notional value of this order, equal to size multiplied by price.">
          <span>Order Value</span>
        </Tooltip>
        <span>{orderValue ? orderValue : 'N/A'}</span>
      </Box>
      <Box className="items">
        <Tooltip content="Margin Required is the estimated collateral you must lock to place or maintain this order at the selected leverage.">
          <span>Margin Required</span>
        </Tooltip>
        <span>{marginRequired ? marginRequired : 'N/A'}</span>
      </Box>
      <Box className="items">
        <Tooltip content="Fees are the estimated trading fees for this order, including maker or taker fees from the venue.">
          <span>Fees</span>
        </Tooltip>
        <span>{fees ? fees : 'N/A'}</span>
      </Box>
    </LiquidationWrapper>
  );
};

export default LiquidationContent;
