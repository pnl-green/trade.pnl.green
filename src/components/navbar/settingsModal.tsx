import { SettingsModalWrapper, StyledCheckBox } from "@/styles/navbar.styles";
import { Box } from "@mui/material";
import React from "react";

const SettingsModal = () => {
  return (
    <SettingsModalWrapper>
      <Box className="innerBox">
        <Box className="settingItems">
          <label>Skip Order Open Confirmation</label>
          <StyledCheckBox>
            <input type="checkbox">
          </StyledCheckBox>
        </Box>
      </Box>
    </SettingsModalWrapper>
  );
};

export default SettingsModal;
