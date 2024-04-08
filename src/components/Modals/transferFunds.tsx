import { Box, ClickAwayListener } from "@mui/material";
import React from "react";
import { IconsStyles, InnerBox, ModalWrapper } from "./styles";

interface ModalProps {
  onClose: () => void;
  onConfirm?: () => void;
  amount?: number | any;
  setAmount?: React.Dispatch<React.SetStateAction<number | any>>;
}

const TransferFunds: React.FC<ModalProps> = ({ onClose }) => {
  return (
    <ModalWrapper>
      <ClickAwayListener onClickAway={onClose}>
        <InnerBox>
          <Box id="closeIcon" sx={{ ...IconsStyles }} onClick={onClose}>
            <img src="/closeIcon.svg" alt="X" />
          </Box>
        </InnerBox>
      </ClickAwayListener>
    </ModalWrapper>
  );
};

export default TransferFunds;
