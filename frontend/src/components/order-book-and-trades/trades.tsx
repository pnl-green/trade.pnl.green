import React from 'react';
import { StyledTable, TradesRows } from '@/styles/orderbook.styles';
import { Box } from '@mui/material';
import { useOrderBookTradesContext } from '@/context/orderBookTradesContext';
import { usePairTokensContext } from '@/context/pairTokensContext';

interface TradesProps {
  maxHeight?: string | number;
}

const Trades = ({ maxHeight = '240px' }: TradesProps) => {
  const { tradesData } = useOrderBookTradesContext();
  const { pair, tokenPairs } = usePairTokensContext();

  const handleDetailsClick = (index: any) => {
    // Implement your logic here
    console.log('Clicked on details for index:', index);
  };

  const sizeLabel = tokenPairs?.[0] ? String(tokenPairs[0]) : '';

  return (
    <Box
      sx={{
        maxHeight,
        overflowY: 'auto',
        overflowX: 'hidden',
        flex: 1,
      }}
    >
      <StyledTable fontSize="11px">
        <thead
          style={{
            position: 'sticky',
            top: '0',
            zIndex: '1',
            backgroundColor: 'rgba(14, 19, 26, 0.9)',
          }}
        >
          <tr>
            <th>Price</th>
            <th>Size({sizeLabel})</th>
            <th>Time</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {Array.isArray(tradesData) && tradesData.length > 0 ? (
            tradesData.map((trade, index) => {
              const formattedPrice = Number(trade.px).toFixed(4);
              const formattedSize = Number(trade.sz).toFixed(4);
              const formattedTime = trade.displayTime ?? new Date(trade.time).toLocaleTimeString();

              return (
                <TradesRows key={index} className="first-column" side={trade.side}>
                  <td className="first-column">{formattedPrice}</td>
                  <td>{formattedSize}</td>
                  <td>{formattedTime}</td>
                  <td
                    className="details-icon"
                    onClick={() => handleDetailsClick(index)}
                  >
                    <img src="/linkIcon.svg" alt="link" />
                  </td>
                </TradesRows>
              );
            })
          ) : (
            <tr>
              <td colSpan={4} style={{ padding: '8px 12px', color: '#A3B3C2' }}>
                No recent trades available
              </td>
            </tr>
          )}
        </tbody>
      </StyledTable>
    </Box>
  );
};

export default Trades;
