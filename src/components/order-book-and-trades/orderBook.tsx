import React, { useState } from "react";
import {
  SpreadAndPairSelects,
  ItemsSelect,
  OrderBookTable,
  Tablerows,
} from "@/styles/orderbook.styles";
import { Box } from "@mui/material";

interface OrderBookProps {
  spread: number;
  pair: string;
  setSpread: (spread: number) => void;
  setPair: (pair: string) => void;
}

const OrderBook = ({ spread, pair, setSpread, setPair }: OrderBookProps) => {
  const bookData = {
    asks: [
      [3000, 0.1, 300],
      [2999, 0.2, 599.8],
      [2998, 0.5, 1499],
      [2997, 0.3, 899.1],
      [2996, 1, 2996],
      [2995, 0.8, 2396],
      [2994, 0.4, 1197.6],
      [2993, 0.6, 1795.8],
      [2992, 0.7, 2094.4],
      [2991, 0.9, 2691.9],
    ],
    bids: [
      [2990, 0.2, 598],
      [2989, 0.3, 896.7],
      [2988, 0.1, 298.8],
      [2987, 0.6, 1792.2],
      [2986, 0.4, 1194.4],
      [2985, 0.8, 2388],
      [2984, 0.5, 1492],
      [2983, 0.7, 2088.1],
      [2982, 0.9, 2683.8],
      [2981, 0.1, 298.1],
    ],
  };

  const calculateWidth = (size: number, total: number) => {
    // Calculate the width based on your logic
    // For example, you can use linear scale or any other formula to map size and total to width
    const maxWidth = 100; // Set maximum width for bars
    const width = (size / total) * maxWidth; // Example: Width proportional to size/total
    return `${width}%`;
  };

  const renderOrderBookTable = (orders: any, type: string) => (
    <tbody>
      {orders.map((order: any, index: any) => (
        <Tablerows
          key={index}
          type={type}
          width={calculateWidth(order[1], order[1])}
        >
          {order.map((data: any, idx: any) => (
            <td key={idx}>{data}</td>
          ))}
        </Tablerows>
      ))}
    </tbody>
  );

  return (
    <Box>
      <SpreadAndPairSelects>
        <div>
          <ItemsSelect
            value={spread}
            onChange={(e) => setSpread(parseInt(e.target.value))}
          >
            {[1, 2, 5, 10, 100, 1000].map((value, index) => (
              <option key={index} value={value}>
                {value}
              </option>
            ))}
          </ItemsSelect>
        </div>
        <div>
          <ItemsSelect value={pair} onChange={(e) => setPair(e.target.value)}>
            {["USD", "ETH"].map((value, index) => (
              <option key={index} value={value}>
                {value}
              </option>
            ))}
          </ItemsSelect>
        </div>
      </SpreadAndPairSelects>

      <div id="the-order-book">
        <OrderBookTable>
          <thead id="header">
            <tr>
              <th>Price</th>
              <th>Size({pair})</th>
              <th>Total({pair})</th>
            </tr>
          </thead>
          {renderOrderBookTable(bookData.asks, "asks")}
          <thead className="spread">
            <tr>
              <th>Spread</th>
              <th>{spread}</th>
              <th></th>
            </tr>
          </thead>
          {renderOrderBookTable(bookData.bids, "bids")}
        </OrderBookTable>
      </div>
    </Box>
  );
};

export default OrderBook;
