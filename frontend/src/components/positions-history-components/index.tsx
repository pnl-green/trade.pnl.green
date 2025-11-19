import React, { useState } from "react";
import {
  PositionsOrdersHistoryWrapper,
} from "@/styles/positionsOrdersHistory.styles";
import PositionComponentTable from "./positions";
import OpenOrdersComponentTable from "./openOrders";
import TwapComponentTable from "./twap";
import TradeHistoryComponentTable from "./tradehistory";
import FundingHistoryComponentTable from "./fundingHistory";
import OrderHistoryComponentTable from "./orderHistory";
import BottomTabs from "../ui/BottomTabs";

const PositionsOrdersHistory = () => {
  const tabLabels = [
    {
      label: "Positions",
      value: "Positions",
      tooltip:
        "Positions lists all of your open positions, including size, entry price, PnL, and liquidation estimates.",
    },
    {
      label: "Open Orders",
      value: "Open Orders",
      tooltip:
        "Open Orders shows all live orders that have been submitted but not fully filled or canceled yet.",
    },
    {
      label: "TWAP",
      value: "TWAP",
      tooltip:
        "TWAP tab shows active and past time-weighted average price orders, including their schedule and fill stats.",
    },
    {
      label: "Trade History",
      value: "Trade History",
      tooltip:
        "Trade History lists every fill in this account, including size, price, fee, and side.",
    },
    {
      label: "Funding History",
      value: "Funding History",
      tooltip:
        "Funding History shows all past funding payments you have paid or received for perpetual futures.",
    },
    {
      label: "Order History",
      value: "Order History",
      tooltip:
        "Order History lists all order lifecycle events—submissions, edits, cancels, and expirations.",
    },
  ];

  const [activeTab, setActiveTab] = useState(tabLabels[0].value);

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <PositionsOrdersHistoryWrapper>
      <BottomTabs tabs={tabLabels} active={activeTab} onChange={handleTabClick} />

      {/*tableComponents*/}
      {activeTab === "Positions" && <PositionComponentTable />}
      {activeTab === "Open Orders" && <OpenOrdersComponentTable />}
      {activeTab === "TWAP" && <TwapComponentTable />}
      {activeTab === "Trade History" && <TradeHistoryComponentTable />}
      {activeTab === "Funding History" && <FundingHistoryComponentTable />}
      {activeTab === "Order History" && <OrderHistoryComponentTable />}
    </PositionsOrdersHistoryWrapper>
  );
};

export default PositionsOrdersHistory;
