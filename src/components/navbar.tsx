import React from "react";
import { NavbarContainer } from "@/styles/navbar.styles";
import { Box } from "@mui/material";
import { GreenBtn, TextBtn } from "@/styles/common.styles";

const Navbar = () => {
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
        <GreenBtn>Wallet Connect</GreenBtn>
        <img src="/userIcon.svg" alt="user" className="user-icon" />
        <img src="/settingsIcon.svg" alt="settings" className="settings-icon" />
        <img src="/moreIcon.svg" alt="more" className="more-icon" />
      </Box>
    </NavbarContainer>
  );
};

export default Navbar;
