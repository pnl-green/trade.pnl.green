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
        <Box>Size</Box>
        <HandleSelectItems
          selectItem={selectSize}
          setSelectItem={setSelectSize}
          selectDataItems={["Default size", "Asset qty"]}
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
        <Box>Order Type</Box>
        <HandleSelectItems
          selectItem={selectOrderType}
          setSelectItem={setSelectOrderType}
          selectDataItems={["Default size", "Asset qty"]}
          menuItemPlaceholder="GTC"
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
        <BuySellBtn sx={{ width: "112px" }} className="active">
          Buy
        </BuySellBtn>
        <BuySellBtn sx={{ width: "112px" }}>Sell</BuySellBtn>
      </Box>
    </>
  );
};

export default LimitComponent;
