import React, { useState } from "react";
import { NavbarContainer } from "@/styles/navbar.styles";
import { Box } from "@mui/material";
import { GreenBtn, TextBtn } from "@/styles/common.styles";
import WalletConnectModal from "../wallet-connect";
import SettingsModal from "./settingsModal";

const Navbar = () => {
  const [settingsModal, setSettingsModal] = useState(false);

  const toggleSettingsModal = () => setSettingsModal((prev) => !prev);

  return (
    <NavbarContainer>
      <Box className="logo">
        <img src="PNL.GREEN.svg" alt="PNL.GREEN" />
      </Box>

      <Box className="external-links">
        <TextBtn className="active">Docs</TextBtn>
        <TextBtn>Twitter</TextBtn>
        <TextBtn>Discord</TextBtn>
        <TextBtn>Original Frontend</TextBtn>
      </Box>

      <Box className="user-config">
        <WalletConnectModal />
        <img src="/userIcon.svg" alt="user" className="user-icon" />
        <Box sx={{ position: "relative" }}>
          <img
            src="/settingsIcon.svg"
            alt="settings"
            className="settings-icon"
            onClick={toggleSettingsModal}
          />
          {settingsModal && (
            <SettingsModal onClose={() => setSettingsModal(false)} />
          )}
        </Box>
        {/* <img src="/moreIcon.svg" alt="more" className="more-icon" /> */}
      </Box>
    </NavbarContainer>
  );
};

export default Navbar;
