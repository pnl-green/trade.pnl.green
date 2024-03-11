import React, { useState } from "react";
import { TabsButtons } from "@/styles/common.styles";
import {
  ItemsSelect,
  OrderBookContainer,
  OrderBookTable,
  OrderBookTabsWrapper,
  SpreadAndPairSelects,
} from "@/styles/orderbook.styles";
import OrderBook from "./orderBook";

const renderOrderBookTable = (orders: any) => (
  <OrderBookTable>
    <tbody>
      {orders.map((order: any, index: any) => (
        <tr key={index}>
          {order.map((data: any, idx: any) => (
            <td key={idx}>{data}</td>
          ))}
        </tr>
      ))}
    </tbody>
  </OrderBookTable>
);

const OrderBookAndTrades = () => {
  const [activeTab, setActiveTab] = useState("Order Book");
  const [spread, setSpread] = useState(1);
  const [pair, setPair] = useState("USD");

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <OrderBookContainer>
      <OrderBookTabsWrapper>
        {["Order Book", "Trade"].map((label) => (
          <TabsButtons
            key={label}
            sx={{
              backgroundColor: "#34484D",
              minWidth: "110px",
              height: "30px",
            }}
            className={activeTab === label ? "active" : ""}
            onClick={() => handleTabClick(label)}
          >
            {label}
          </TabsButtons>
        ))}
      </OrderBookTabsWrapper>

      {activeTab === "Order Book" && (
        <OrderBook
          spread={spread}
          pair={pair}
          setSpread={setSpread}
          setPair={setPair}
        />
      )}
      {activeTab === "Trade" && <div>Trades</div>}
    </OrderBookContainer>
  );
};

export default OrderBookAndTrades;
