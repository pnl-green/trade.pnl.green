import { InputCheckBox, SelectItemsBox } from "@/styles/riskManager.styles";
import { Box } from "@mui/material";
import React, { useState } from "react";
import HandleSelectItems from "../handleSelectItems";
import { BuySellBtn, FlexItems } from "@/styles/common.styles";

const ChaseOrderTerminal = () => {
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
        <span>Allowed Before Market Purchase</span>
        <span>5%</span>
      </SelectItemsBox>

      <SelectItemsBox>
        <input placeholder="Size" />
        <HandleSelectItems
          selectItem={selectItem}
          setSelectItem={setSelectItem}
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
        <input placeholder="Size" />
        <HandleSelectItems
          selectItem={selectItem}
          setSelectItem={setSelectItem}
          selectDataItems={["ETH", "USD"]}
          menuItemPlaceholder="size"
        />
      </SelectItemsBox>

      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-evenly",
          mt: "5px",
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

export default ChaseOrderTerminal;
