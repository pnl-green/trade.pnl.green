import React, { useState } from "react";
import { Box, ClickAwayListener } from "@mui/material";
import { IconsStyles, InnerBox, MarginTabs, ModalWrapper } from "./styles";
import { GreenBtn } from "@/styles/common.styles";
import { TabsButton } from "@/styles/riskManager.styles";

interface ModalProps {
  onClose: () => void;
}

const MarginTypeModal: React.FC<ModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState("Cross");

  const handleTabChange = (tabName: string) => {
    setActiveTab(tabName);
  };
  const marginInforText =
    activeTab === "Cross"
      ? `All cross positions share the same cross margin as collateral. In the event of liquidation, your cross margin balance and any remaining open positions under assets in this mode may be forfeited.`
      : activeTab === "Isolated"
      ? `Manage your risk on individual positions by restricting the amount of margin allocated to each. If the margin ratio of an isolated position reaches 100%, the position will be liquidated. Margin can be added or removed to individual positions in this mode.`
      : null;

  return (
    <ModalWrapper>
      <ClickAwayListener onClickAway={onClose}>
        <InnerBox sx={{ width: "562px" }}>
          <Box
            id="closeIcon"
            sx={{
              ...IconsStyles,
              img: { width: "16px", height: "16px" },
              right: "20px",
              top: "15px",
            }}
            onClick={onClose}
          >
            <img src="/closeIcon.svg" alt="X" />
          </Box>
          <Box
            sx={{
              width: "100%",
              padding: "20px 30px",
              borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
              fontSize: "20px",
              fontFamily: "Sora",
            }}
          >
            APE-USD Margin Mode
          </Box>
          <Box
            sx={{
              width: "100%",
              padding: "35px 30px 40px 30px",
              borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
              fontSize: "14px",
              fontFamily: "Sora",
              display: "flex",
              flexDirection: "column",

              p: {
                color: "#FFFFFF",
              },

              span: {
                mt: "20px",
                color: "#B04747",
              },
            }}
          >
            <MarginTabs>
              {["Cross", "Isolated"].map((tabName) => (
                <TabsButton
                  sx={{
                    width: "50%",
                    color: "#fff",
                    fontSize: "15px",
                    fontWeight: "600",
                    padding: "5px 0 10px 0",
                    justifyContent: "center",
                  }}
                  key={tabName}
                  className={activeTab === tabName ? "active" : ""}
                  onClick={() => handleTabChange(tabName)}
                >
                  {tabName}
                </TabsButton>
              ))}
            </MarginTabs>

            <Box sx={{ mt: "20px" }}>
              <p>{marginInforText}</p>
            </Box>
          </Box>
          <GreenBtn
            sx={{
              m: "15px 30px",
              borderRadius: "7px",
              height: "42px",
              fontSize: "16px",
            }}
          >
            Connect
          </GreenBtn>
        </InnerBox>
      </ClickAwayListener>
    </ModalWrapper>
  );
};

export default MarginTypeModal;
