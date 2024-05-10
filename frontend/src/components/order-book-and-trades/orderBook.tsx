import React from 'react';
import {
  SpreadAndPairSelects,
  StyledTable,
  Tablerows,
} from '@/styles/orderbook.styles';
import { Box } from '@mui/material';
import HandleSelectItems from '../handleSelectItems';
import { usePairTokensContext } from '@/context/pairTokensContext';
import { useOrderBookTradesContext } from '@/context/orderBookTradesContext';
import { SizeEquivalentsProps } from '@/utils/usdEquivalents';

interface OrderBookProps {
  spread: number;
  pair: string;
  setSpread: (spread: number) => void;
  setPair: (pair: string) => void;
}

const calculateBarWidth = (size: number, max: number) => {
  return (size / max) * 100; // Assuming a percentage-based width
};

//only calculate the USD equivalent of a given size of a token pair
export const getUsdEquivalentOnly = ({
  size,
  currentMarkPrice,
  token,
}: SizeEquivalentsProps) => {
  if (token.toUpperCase() === 'USD') {
    return Math.trunc(size * currentMarkPrice);
  } else {
    return size;
  }
};

const renderOrderBookTable = (
  orders: { px: number; sz: number; n: number }[],
  type: string,
  pair: string
) => {
  const maxOrderSize = Math.max(...orders.map((order) => order.sz));

  return (
    <tbody>
      {orders.map((order, index) => (
        <Tablerows
          key={index}
          type={type}
          width={calculateBarWidth(order.sz, maxOrderSize)}
        >
          <td className="first-column">{order.px}</td>
          <td>
            {getUsdEquivalentOnly({
              size: Number(order.sz),
              currentMarkPrice: Number(order.px),
              token: pair,
            })}
          </td>
          <td>{order.n}</td>
        </Tablerows>
      ))}
    </tbody>
  );
};

const OrderBook = ({ spread, pair, setSpread, setPair }: OrderBookProps) => {
  const { tokenPairs } = usePairTokensContext();
  const { bookData, loadingBookData } = useOrderBookTradesContext();
  const [spreadPercentage, setSpreadPercentage] = React.useState(0);

  function getBookData() {
    let limit = 10;
    const asks = bookData.asks.slice(0, limit).sort((a, b) => a.px - b.px);
    const bids = bookData.bids.slice(0, limit).sort((a, b) => a.px - b.px);

    return { asks, bids };
  }

  return (
    <Box>
      <SpreadAndPairSelects>
        <div>
          <HandleSelectItems
            styles={{ background: '#131212' }}
            selectItem={spread}
            setSelectItem={setSpread}
            selectDataItems={['1', '2', '5', '10', '100', '1000']}
          />
        </div>
        <div>
          <HandleSelectItems
            styles={{ background: '#131212' }}
            selectItem={pair}
            setSelectItem={setPair}
            selectDataItems={[`${tokenPairs[0]}`, `${tokenPairs[1]}`]}
          />
        </div>
      </SpreadAndPairSelects>

      <div id="the-order-book">
        <StyledTable>
          <thead id="header">
            <tr>
              <th>Price</th>
              <th>Size({pair})</th>
              <th>Total({pair})</th>
            </tr>
          </thead>

          {loadingBookData ? (
            <span style={{ color: '#fff' }}>loading...</span>
          ) : !loadingBookData &&
            bookData.asks.length === 0 &&
            bookData.bids.length === 0 ? (
            <tbody>
              <tr
                style={{
                  color: '#fff',
                  fontSize: '14px',
                }}
              >
                No data Available for {pair}
              </tr>
            </tbody>
          ) : (
            <>
              {renderOrderBookTable(getBookData().asks, 'asks', pair)}
              {getBookData().asks.length !== 0 &&
                getBookData().bids.length !== 0 && (
                  <thead className="spread">
                    <tr>
                      <th>Spread</th>
                      <th>{spread}</th>
                      <th>{spreadPercentage}%</th>
                    </tr>
                  </thead>
                )}
              {renderOrderBookTable(getBookData().bids, 'bids', pair)}
            </>
          )}
        </StyledTable>
      </div>
    </Box>
  );
};

export default OrderBook;
