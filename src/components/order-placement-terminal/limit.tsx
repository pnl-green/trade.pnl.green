import {
  LiquidationWrapper,
  SelectItemsBox,
} from "@/styles/riskManager.styles";
import { Box } from "@mui/material";
import React, { useEffect, useState } from "react";
import HandleSelectItems from "../handleSelectItems";
import { ButtonStyles, BuySellBtn, FlexItems } from "@/styles/common.styles";
import { RenderInput } from "./commonInput";
import { usePairTokensContext } from "@/context/pairTokensContext";
import ConfirmationModal from "./confirmationModals";

const LimitComponent = () => {
  const { tokenPairs } = usePairTokensContext();
  const [selectOrderType, setSelectOrderType] = useState("GTC");
  const [radioValue, setRadioValue] = useState("");
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [isBuyOrSell, setIsBuyOrSell] = useState(""); //buy | sell
  const [selectItem, setSelectItem] = useState(`${tokenPairs[0]}`);
  const [size, setSize] = useState<number | any>("");

  //Take Profit / Stop Loss
  const [takeProfitPrice, setTakeProfitPrice] = useState<number | any>("");
  const [stopLossPrice, setStopLossPrice] = useState<number | any>("");
  const [gain, setGain] = useState<number | any>("");
  const [loss, setLoss] = useState<number | any>("");

  const [estLiqPrice, setEstLiquidationPrice] = useState<number | any>("100");
  const [fee, setFee] = useState<number | any>("100");

  const toggleConfirmModal = (button: string) => {
    setConfirmModalOpen(true);
    setIsBuyOrSell(button);
  };

  const handleRadioChange = (e: {
    target: { value: React.SetStateAction<string> };
  }) => {
    setRadioValue(e.target.value);
  };

  useEffect(() => {
    setSelectItem(`${tokenPairs[0]}`);
  }, [tokenPairs]);
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
          value={size}
          onChange={(e: any) => setSize(e.target.value)}
          styles={{
            background: "transparent",
            ":hover": {
              border: "none !important",
            },
          }}
        />
        <HandleSelectItems
          selectItem={selectItem}
          setSelectItem={setSelectItem}
          selectDataItems={[`${tokenPairs[0]}`, `${tokenPairs[1]}`]}
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
              value={takeProfitPrice}
              onChange={(e: any) => setTakeProfitPrice(e.target.value)}
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
              value={stopLossPrice}
              onChange={(e: any) => setStopLossPrice(e.target.value)}
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

      <SelectItemsBox
        sx={{
          "&:hover": {
            border: "none !important",
          },
        }}
      >
        <span>Order Type</span>
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
        <BuySellBtn
          sx={{ width: "112px" }}
          className="buyBtn"
          onClick={() => toggleConfirmModal("buy")}
        >
          Buy
        </BuySellBtn>
        <BuySellBtn
          sx={{ width: "112px" }}
          className="sellBtn"
          onClick={() => toggleConfirmModal("sell")}
        >
          Sell
        </BuySellBtn>
      </Box>

      {confirmModalOpen && (
        <ConfirmationModal
          onClose={() => setConfirmModalOpen(false)}
          onConfirm={function (): void {
            throw new Error("Function not implemented.");
          }}
          isLimit={true}
          size={`${size} ${selectItem}`}
          isTpSl={radioValue === "2" ? true : false}
          takeProfitPrice={radioValue === "2" ? takeProfitPrice : undefined}
          stopLossPrice={radioValue === "2" ? stopLossPrice : undefined}
          estLiqPrice={estLiqPrice}
          fee={fee}
          isBuyOrSell={isBuyOrSell}
        />
      )}

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
