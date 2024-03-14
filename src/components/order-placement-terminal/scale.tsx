import { InputCheckBox, SelectItemsBox } from "@/styles/riskManager.styles";
import { Box } from "@mui/material";
import React, { useState } from "react";
import HandleSelectItems from "../handleSelectItems";
import { BuySellBtn, FlexItems } from "@/styles/common.styles";

const ScaleOrderTerminal = () => {
  const [selectItem, setSelectItem] = useState("");
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
          selectItem={selectItem}
          setSelectItem={setSelectItem}
          selectDataItems={["ETH", "USD"]}
          menuItemPlaceholder="size"
        />
      </SelectItemsBox>
      <FlexItems>
        <SelectItemsBox sx={{ width: "50%", mt: "0px" }}>
          <span>Start Price</span>
          <span>$1000</span>
        </SelectItemsBox>
        <SelectItemsBox sx={{ width: "45%", mt: "0px" }}>
          <span>End price</span>
          <span>$1M</span>
        </SelectItemsBox>
      </FlexItems>

      <FlexItems>
        <SelectItemsBox sx={{ width: "55%", mt: "0px" }}>
          <span>Total no.of Orders</span>
          <span>4</span>
        </SelectItemsBox>
        <SelectItemsBox sx={{ width: "40%", mt: "0px" }}>
          <span>Size</span>
          <span>Skew</span>
        </SelectItemsBox>
      </FlexItems>

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

      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-evenly",
          mt: "10px",
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

export default ScaleOrderTerminal;
