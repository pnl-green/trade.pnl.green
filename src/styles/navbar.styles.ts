import { Box, styled } from "@mui/material";

export const NavbarContainer = styled(Box)(() => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "10px 30px",
  width: "100vw",
  height: "70px",
  backgroundColor: "#000",
  zIndex: 100,

  ".logo": {
    img: {
      width: "120px",
      height: "27px",
    },
  },

  ".external-links": {
    display: "flex",
    flexDirection: "row",
    gap: "10px",
  },

  ".user-config": {
    display: "flex",
    flexDirection: "row",
    gap: "20px",
    alignItems: "center",
    "*": {
      cursor: "pointer",
    },
  },
  ".user-icon": {
    width: "29px",
    height: "19px",
  },

  ".settings-icon": {
    width: "25px",
    height: "22px",
  },
  ".more-icon": {
    width: "22px",
    height: "22px",
  },
}));
