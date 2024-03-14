import React, { useState } from "react";
import { InputCheckBox, SelectItemsBox } from "@/styles/riskManager.styles";
import { Box } from "@mui/material";
import HandleSelectItems from "../handleSelectItems";
import { BuySellBtn, FlexItems } from "@/styles/common.styles";

const TwapOrderTerminal = () => {
  const [timeBtwnIntervals, setTimeBtwnIntervals] = useState("");
  const [size, setSize] = useState("");
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
        <input placeholder="Time Between Intervals" />
        <HandleSelectItems
          selectItem={timeBtwnIntervals}
          setSelectItem={setTimeBtwnIntervals}
          selectDataItems={["ETH", "USD"]}
        />
      </SelectItemsBox>

      <FlexItems sx={{ mt: "15px" }}>
        <span>Total intervals</span>
        <span>10:00</span>
      </FlexItems>

      <SelectItemsBox>
        <input placeholder="Size" />
        <HandleSelectItems
          selectItem={size}
          setSelectItem={setSize}
          selectDataItems={["ETH", "USD"]}
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

export default TwapOrderTerminal;
