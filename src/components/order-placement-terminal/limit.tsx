import { InputCheckBox, SelectItemsBox } from "@/styles/riskManager.styles";
import { Box } from "@mui/material";
import React, { useState } from "react";
import HandleSelectItems from "../handleSelectItems";
import { BuySellBtn, FlexItems } from "@/styles/common.styles";

const LimitComponent = () => {
  const [selectSize, setSelectSize] = useState("");
  const [selectOrderType, setSelectOrderType] = useState("");
  return (
    <>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: "5px",
          mt: "20px",
        }}
      >
        <FlexItems>
          <span>Available balance</span>
          <span>10:00</span>
        </FlexItems>
        <FlexItems>
          <span>Current position size</span>
          <span>0.0 APE</span>
        </FlexItems>
      </Box>

      <SelectItemsBox>
      <input placeholder="Size" />
        <HandleSelectItems
          selectItem={selectSize}
          setSelectItem={setSelectSize}
          selectDataItems={["ETH", "USD"]}
          menuItemPlaceholder="size"
        />
      </SelectItemsBox>

      <Box sx={{ mt: "20px" }}>
        <FlexItems sx={{ justifyContent: "flex-start" }}>
          <InputCheckBox />
          <span>Reduce Only</span>
        </FlexItems>

        <FlexItems sx={{ justifyContent: "flex-start" }}>
          <InputCheckBox />
          <span>Take Profit / Stop Loss</span>
        </FlexItems>
      </Box>

      <SelectItemsBox>
        <input placeholder="Order Type" />
        <HandleSelectItems
          selectItem={selectOrderType}
          setSelectItem={setSelectOrderType}
          selectDataItems={["GTC", "IOC", "ALO"]}
          menuItemPlaceholder="order-type"
        />
      </SelectItemsBox>

      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-evenly",
          mt: "30px",
        }}
      >
        <BuySellBtn sx={{ width: "112px" }} className="buyBtn">
          Buy
        </BuySellBtn>
        <BuySellBtn sx={{ width: "112px" }} className="sellBtn">
          Sell
        </BuySellBtn>
      </Box>
    </>
  );
};

export default LimitComponent;
