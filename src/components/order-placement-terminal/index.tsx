import { Box } from "@mui/material";
import React, { useState } from "react";
import {
  RiskManagerWrapper,
  TabsButton,
  TabsWrapper,
} from "@/styles/riskManager.styles";
import MarketComponent from "./market";
import LimitComponent from "./limit";
import TwapOrderTerminal from "./twap";
import ChaseOrderTerminal from "./chase";
import ScaleOrderTerminal from "./scale";
import RiskManagerModal from "../Modals/riskManagerModal";
import LeverageModal from "../Modals/leverageModal";
import MarginTypeModal from "../Modals/marginTypeModal";

const OrderPlacementTerminal = () => {
  const [activeTab, setActiveTab] = useState("Market");
  const [riskManagerModal, setRiskManagerModal] = useState(false);
  const [leverageModal, setLeverageModal] = useState(false);
  const [marginTypeModal, setMarginTypeModal] = useState(false);

  const toggleModals = (modalType: string) => {
    switch (modalType) {
      case "riskManager":
        setRiskManagerModal(!riskManagerModal);
        break;
      case "leverage":
        setLeverageModal(!leverageModal);
        break;
      case "marginType":
        setMarginTypeModal(!marginTypeModal);
        break;
      default:
        break;
    }
  };

  const handleTabChange = (tabName: string) => {
    setActiveTab(tabName);
  };

  return (
    <RiskManagerWrapper id="order-placement-terminal">
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <div className="captions" onClick={() => toggleModals("riskManager")}>
          Risk Manager
        </div>
        <div className="captions" onClick={() => toggleModals("leverage")}>
          Leverage
        </div>
        <div className="captions" onClick={() => toggleModals("marginType")}>
          Margin Type
        </div>
      </Box>

      {riskManagerModal ? (
        <RiskManagerModal onClose={() => setRiskManagerModal(false)} />
      ) : leverageModal ? (
        <LeverageModal onClose={() => setLeverageModal(false)} />
      ) : marginTypeModal ? (
        <MarginTypeModal onClose={() => setMarginTypeModal(false)} />
      ) : null}

      <TabsWrapper>
        {["Market", "Limit", "TWAP", "Chase", "Scale"].map((tabName) => (
          <TabsButton
            key={tabName}
            className={activeTab === tabName ? "active" : ""}
            onClick={() => handleTabChange(tabName)}
          >
            {tabName}
          </TabsButton>
        ))}
      </TabsWrapper>

      {/* Conditionally render components based on active tab */}
      {activeTab === "Market" && <MarketComponent />}
      {activeTab === "Limit" && <LimitComponent />}
      {activeTab === "TWAP" && <TwapOrderTerminal />}
      {activeTab === "Chase" && <ChaseOrderTerminal />}
      {activeTab === "Scale" && <ScaleOrderTerminal />}
    </RiskManagerWrapper>
  );
};

export default OrderPlacementTerminal;
