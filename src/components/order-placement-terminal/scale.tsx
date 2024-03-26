import {
  LiquidationWrapper,
  SelectItemsBox,
} from "@/styles/riskManager.styles";
import { Box } from "@mui/material";
import React, { useState } from "react";
import HandleSelectItems from "../handleSelectItems";
import { ButtonStyles, BuySellBtn, FlexItems } from "@/styles/common.styles";
import { RenderInput } from "./common-input";

const ScaleOrderTerminal = () => {
  const [selectItem, setSelectItem] = useState("");
  const [radioValue, setRadioValue] = useState("");

  const handleRadioChange = (e: {
    target: { value: React.SetStateAction<string> };
  }) => {
    setRadioValue(e.target.value);
  };
  return (
    <Box
      sx={{
        position: "relative",
        height: radioValue === "2" ? "calc(100% + 85px)" : "100%",
      }}
    >
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

      <Box sx={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <SelectItemsBox>
          <RenderInput
            label="Size"
            placeholder="|"
            styles={{
              background: "transparent",
              ".placeholder_box": {
                fontSize: "12px",
              },
              ":hover": {
                border: "none !important",
              },
            }}
          />
          <HandleSelectItems
            selectItem={selectItem}
            setSelectItem={setSelectItem}
            selectDataItems={["ETH", "USD"]}
          />
        </SelectItemsBox>
        <FlexItems>
          <RenderInput
            label="Start Price"
            placeholder="0"
            styles={{
              gap: 0,
              width: "52%",
              ".placeholder_box": {
                fontSize: "12px",
              },
              input: { width: "30%", padding: "0" },
            }}
          />

          <RenderInput
            label="End price"
            placeholder="0"
            styles={{
              gap: 0,
              width: "45%",
              ".placeholder_box": {
                fontSize: "12px",
              },
              input: { width: "30%", padding: "0" },
            }}
          />
        </FlexItems>

        <FlexItems>
          <RenderInput
            label="Total no.of Orders"
            placeholder="0"
            styles={{
              gap: 0,
              width: "55%",
              ".placeholder_box": {
                width: "90% !important",
                fontSize: "12px",
              },
              input: { width: "20%", padding: "0" },
            }}
          />

          <RenderInput
            label="Size skew"
            placeholder="0"
            styles={{
              gap: 0,
              width: "40%",
              ".placeholder_box": {
                fontSize: "12px",
              },
              input: { width: "30%", padding: "0" },
            }}
          />
        </FlexItems>
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          mt: "20px",
          gap: "8px",
          label: {
            marginRight: "8px",
            cursor: "pointer",
          },
        }}
      >
        <FlexItems
          sx={{
            justifyContent: "flex-start",
          }}
        >
          <label>
            <input
              type="radio"
              name="radio"
              value="1"
              onChange={handleRadioChange}
            />
          </label>
          <span>Reduce Only</span>
        </FlexItems>

        <FlexItems sx={{ justifyContent: "flex-start" }}>
          <label>
            <input
              type="radio"
              name="radio"
              value="2"
              onChange={handleRadioChange}
            />
          </label>
          <span>Take Profit / Stop Loss</span>
        </FlexItems>
      </Box>
      {radioValue === "2" && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            mt: "10px",
            height: "70px",
            gap: "2px",
          }}
        >
          <FlexItems>
            <RenderInput
              label="TP Price"
              placeholder="0"
              styles={{
                gap: 0,
                width: "49%",
                ".placeholder_box": {
                  fontSize: "12px",
                },
                input: { width: "30%", padding: "0" },
              }}
            />

            <RenderInput
              label="Gain"
              placeholder="$"
              styles={{
                gap: 0,
                width: "49%",
                ".placeholder_box": {
                  fontSize: "12px",
                },
                input: { width: "30%", padding: "0" },
              }}
            />
          </FlexItems>

          <FlexItems>
            <RenderInput
              label="SL Price"
              placeholder="0"
              styles={{
                gap: 0,
                width: "49%",
                ".placeholder_box": {
                  width: "90% !important",
                  fontSize: "12px",
                },
                input: { width: "20%", padding: "0" },
              }}
            />

            <RenderInput
              label="Loss"
              placeholder="$"
              styles={{
                gap: 0,
                width: "49%",
                ".placeholder_box": {
                  fontSize: "12px",
                },
                input: { width: "30%", padding: "0" },
              }}
            />
          </FlexItems>
        </Box>
      )}

      <Box sx={{ ...ButtonStyles }}>
        <BuySellBtn sx={{ width: "112px" }} className="buyBtn">
          Buy
        </BuySellBtn>
        <BuySellBtn sx={{ width: "112px" }} className="sellBtn">
          Sell
        </BuySellBtn>
      </Box>

      <LiquidationWrapper sx={{ position: "absolute", bottom: 0 }}>
        <Box className="items">
          <span>Liquidation Price</span>
          <span>N/A</span>
        </Box>
        <Box className="items">
          <span>Order Value</span>
          <span>N/A</span>
        </Box>
        <Box className="items">
          <span>Margin Required</span>
          <span>N/A</span>
        </Box>
        <Box className="items">
          <span>Fees</span>
          <span>N/A</span>
        </Box>
      </LiquidationWrapper>
    </Box>
  );
};

export default ScaleOrderTerminal;
