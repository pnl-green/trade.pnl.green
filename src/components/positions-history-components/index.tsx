import React, { useState } from "react";
import {
  PositionTabsButtons,
  PositionTabsButtonsWrapper,
  PositionsOrdersHistoryWrapper,
} from "@/styles/positionsOrdersHistory.styles";
import PositionComponentTable from "./positions";
import OpenOrdersComponentTable from "./openOrders";
import TwapComponentTable from "./twap";

const PositionsOrdersHistory = () => {
  const tabLabels = [
    "Positions",
    "Open Orders",
    "TWAP",
    "Trade History",
    "Funding History",
    "Order History",
  ];

  const [activeTab, setActiveTab] = useState(tabLabels[0]);

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <PositionsOrdersHistoryWrapper>
      <PositionTabsButtonsWrapper>
        {tabLabels.map((label) => (
          <PositionTabsButtons
            className={activeTab === label ? "active" : ""}
            onClick={() => handleTabClick(label)}
          >
            {label}
          </PositionTabsButtons>
        ))}
      </PositionTabsButtonsWrapper>

      {/*tableComponents*/}
      {activeTab === "Positions" && <PositionComponentTable />}
      {activeTab === "Open Orders" && <OpenOrdersComponentTable />}
      {activeTab === "TWAP" && <TwapComponentTable />}
    </PositionsOrdersHistoryWrapper>
  );
};

export default PositionsOrdersHistory;
