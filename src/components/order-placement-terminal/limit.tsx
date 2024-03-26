import {
  LiquidationWrapper,
  SelectItemsBox,
} from "@/styles/riskManager.styles";
import { Box } from "@mui/material";
import React, { useState } from "react";
import HandleSelectItems from "../handleSelectItems";
import { ButtonStyles, BuySellBtn, FlexItems } from "@/styles/common.styles";
import { RenderInput } from "./commonInput";

const LimitComponent = () => {
  const [selectSize, setSelectSize] = useState("");
  const [selectOrderType, setSelectOrderType] = useState("");

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

      <SelectItemsBox>
        <RenderInput
          label={"Size"}
          placeholder="|"
          styles={{
            background: "transparent",
            ":hover": {
              border: "none !important",
            },
          }}
        />
        <HandleSelectItems
          selectItem={selectSize}
          setSelectItem={setSelectSize}
          selectDataItems={["ETH", "USD"]}
        />
      </SelectItemsBox>

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
              checked={radioValue === "1"}
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
              checked={radioValue === "2"}
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

      <SelectItemsBox>
        <RenderInput
          label="Order Type"
          placeholder="|"
          styles={{
            background: "transparent",
            ".placeholder_box": {
              width: "70% !important",
            },
            ":hover": {
              border: "none !important",
            },
          }}
        />
        <HandleSelectItems
          selectItem={selectOrderType}
          setSelectItem={setSelectOrderType}
          selectDataItems={["GTC", "IOC", "ALO"]}
          styles={{
            marginTop: radioValue === "2" ? "10px" : "0",
          }}
        />
      </SelectItemsBox>

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

export default LimitComponent;
