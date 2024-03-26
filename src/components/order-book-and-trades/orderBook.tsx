import React from "react";
import {
  SpreadAndPairSelects,
  StyledTable,
  Tablerows,
} from "@/styles/orderbook.styles";
import { Box } from "@mui/material";
import HandleSelectItems from "../handleSelectItems";
import { usePairTokens } from "@/context/pairTokensContext";

interface OrderBookProps {
  spread: number;
  pair: string;
  setSpread: (spread: number) => void;
  setPair: (pair: string) => void;
}

const bookData = {
  asks: [
    [3000, 0.1, 300],
    [2999, 0.2, 599.8],
    [2998, 0.5, 1499],
    [2997, 0.3, 899.1],
    [2996, 0.5, 2996],
    [2995, 0.8, 2396],
    [2994, 0.4, 1197.6],
    [2993, 0.6, 1795.8],
    [2992, 0.3, 2094.4],
    [2991, 0.1, 2691.9],
    [2991, 0.1, 2691.9],
    [2991, 0.1, 2691.9],
  ],
  bids: [
    [2990, 0.2, 598],
    [2989, 0.3, 896.7],
    [2988, 0.1, 298.8],
    [2987, 0.6, 1792.2],
    [2986, 0.4, 1194.4],
    [2985, 0.8, 2388],
    [2984, 0.5, 1492],
    [2983, 0.2, 2088.1],
    [2982, 0.3, 2683.8],
    [2981, 0.2, 298.1],
  ],
};

const calculateBarWidth = (size: number, max: number) => {
  return (size / max) * 100; // Assuming a percentage-based width
};

const renderOrderBookTable = (orders: any, type: string) => {
  const maxOrderSize = Math.max(...orders.map((order: any) => order[1]));

  return (
    <tbody>
      {orders.map((order: any, index: any) => (
        <Tablerows
          key={index}
          type={type}
          width={calculateBarWidth(order[1], maxOrderSize)}
        >
          {order.map((data: any, idx: any) => (
            <td key={idx} className={idx === 0 ? "first-column" : ""}>
              {data}
            </td>
          ))}
        </Tablerows>
      ))}
    </tbody>
  );
};

const OrderBook = ({ spread, pair, setSpread, setPair }: OrderBookProps) => {
  const { tokenPairs } = usePairTokens();
  const [spreadPercentage, setSpreadPercentage] = React.useState(0);

  function getBookData() {
    let limit = 10;
    const asks = bookData.asks.slice(0, limit);
    const bids = bookData.bids.slice(0, limit);
    return { asks, bids };
  }

  // const

  return (
    <Box>
      <SpreadAndPairSelects>
        <div>
          <HandleSelectItems
            styles={{ background: "#131212" }}
            selectItem={spread}
            setSelectItem={setSpread}
            selectDataItems={["1", "2", "5", "10", "100", "1000"]}
          />
        </div>
        <div>
          <HandleSelectItems
            styles={{ background: "#131212" }}
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
          {renderOrderBookTable(getBookData().asks, "asks")}
          <thead className="spread">
            <tr>
              <th>Spread</th>
              <th>{spread}</th>
              <th>{spreadPercentage}%</th>
            </tr>
          </thead>
          {renderOrderBookTable(getBookData().bids, "bids")}
        </StyledTable>
      </div>
    </Box>
  );
};

export default OrderBook;
