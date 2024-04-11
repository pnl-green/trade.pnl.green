import React, { useState } from "react";
import { Box, ClickAwayListener, styled } from "@mui/material";
import { IconsStyles, InnerBox, ModalWrapper } from "./styles";
import { GreenBtn, TextBtn } from "@/styles/common.styles";
import BigNumber from "bignumber.js";
import { AccountProps } from "@/pages/sub-accounts";

interface ModalProps {
  onClose: () => void;
  onConfirm?: () => void;
  amount?: number | any;
  setAmount?: React.Dispatch<React.SetStateAction<number | any>>;
  masterAccount?: AccountProps;
  subAccount?: AccountProps;
}

const TransferFunds: React.FC<ModalProps> = ({
  onClose,
  onConfirm,
  amount,
  setAmount,
  masterAccount,
  subAccount,
}) => {
  const [isSwitched, setIsSwitched] = useState(false); // state to manage switch status

  const switchAccounts = () => {
    setIsSwitched(!isSwitched);
  };

  const switchAccData = () => {
    const fromAccount = isSwitched ? subAccount?.name : masterAccount?.name;
    const toAccount = isSwitched ? masterAccount?.name : subAccount?.name;
    const availableBalance =
      fromAccount === subAccount?.name
        ? subAccount?.equity
        : masterAccount?.equity || 0;

    return { fromAccount, toAccount, availableBalance };
  };

  const isInputAmountGreaterThanBalance = new BigNumber(
    amount || 0
  ).isGreaterThan(new BigNumber(switchAccData().availableBalance));

  function handleMaxClick() {
    if (Number(switchAccData().availableBalance) > 0) {
      setAmount?.(switchAccData().availableBalance);
    }
  }

  return (
    <ModalWrapper>
      <ClickAwayListener onClickAway={onClose}>
        <InnerBox>
          <CloseIcon id="closeIcon" onClick={onClose} sx={IconsStyles}>
            <img src="/closeIcon.svg" alt="X" />
          </CloseIcon>
          <HeaderDivider />
          <ContentBox>
            <h1>Transfer USDC</h1>
            <Box className="switcher_box">
              <Box className="from_to">
                <label>From</label>
                <Box className="acc_name">{switchAccData().fromAccount}</Box>
              </Box>
              <img
                src="/SwitchIcon.png"
                alt="switch"
                onClick={switchAccounts}
              />
              <Box className="from_to">
                <label>To</label>
                <Box className="acc_name">{switchAccData().toAccount}</Box>
              </Box>
            </Box>
            <Box className="amount_box">
              <input
                type="number"
                placeholder="Amount"
                value={amount}
                onChange={(e) => setAmount?.(e.target.value)}
              />
              <TextBtn sx={{ color: "#049260" }} onClick={handleMaxClick}>
                Max
              </TextBtn>
            </Box>
            <AvailableBalanceStyles>
              <span>Available to transfer</span>
              <span>{Number(switchAccData().availableBalance).toFixed(2)}</span>
            </AvailableBalanceStyles>
          </ContentBox>
          <ActionBox>
            <GreenBtn
              disabled={isInputAmountGreaterThanBalance || amount.trim() === ""}
              onClick={onConfirm}
            >
              Confirm
            </GreenBtn>
          </ActionBox>
        </InnerBox>
      </ClickAwayListener>
    </ModalWrapper>
  );
};

export default TransferFunds;

//styles
const CloseIcon = styled(Box)(() => ({
  cursor: "pointer",
}));

const HeaderDivider = styled(Box)(() => ({
  width: "100%",
  height: "40px",
  borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
}));

const ContentBox = styled(Box)(() => ({
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  width: "100%",
  padding: "30px 20px",
  borderBottom: "1px solid rgba(255, 255, 255, 0.2)",

  h1: {
    fontFamily: "Sora",
    fontWeight: "400",
    fontSize: "20px",
    textAlign: "center",
  },

  ".switcher_box": {
    display: "flex",
    flexDirection: "row",
    width: "100%",
    marginTop: "20px",
    alignItems: "center",
    justifyContent: "space-between",
    position: "relative",

    img: {
      position: "absolute",
      cursor: "pointer",
      left: "50%",
      transform: "translateX(-50%)",
    },

    ".from_to": {
      display: "flex",
      flexDirection: "column",
    },

    label: {
      color: "#B2AEAE",
      fontFamily: "Sora",
      fontWeight: "400",
      fontSize: "15px",
    },

    ".acc_name": {
      marginTop: "10px",
      background: "#0F1A1F",
      fontFamily: "Sora",
      fontWeight: "400",
      fontSize: "15px",
      padding: "5px 8px",
    },
  },

  ".amount_box": {
    display: "flex",
    flexDirection: "row",
    width: "100%",
    height: "38px",
    padding: "0 0 0 10px",
    border: "1px solid #FFFFFF38",
    borderRadius: "4px",
    justifyContent: "space-between",
    marginTop: "20px",

    input: {
      outline: "none",
      border: "none",
      height: "100%",
      width: "80%",
      padding: "0 0 0 10px",
      background: "inherit",
      color: "#fff",
      fontFamily: "Sora",
      fontWeight: "400",
      fontSize: "14px",

      "::placeholder": {
        color: "#fff",
      },
    },
  },
}));

const ActionBox = styled(Box)(() => ({
  display: "flex",
  padding: "10px 20px",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",

  button: {
    width: "100%",
  },
}));

const AvailableBalanceStyles = styled(Box)(() => ({
  display: "flex",
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  width: "100%",
  marginTop: "10px",

  fontFamily: "Sora",
  fontWeight: "400",
  fontSize: "14px",
}));
