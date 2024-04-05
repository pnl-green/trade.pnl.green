import { Box, styled } from "@mui/material";

export const NavbarContainer = styled(Box)(() => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "10px 30px",
  width: "100vw",
  // height: "70px",
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
    gap: "40px",
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

export const SettingsModalWrapper = styled(Box)(() => ({
  display: "flex",
  flexDirection: "column",
  padding: "10px",
  background: "#000",
  position: "absolute",

  ".innerBox": {
    display: "flex",
    flexDirection: "column",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: "5px",
    padding: "10px",
  },

  ".settingItems": {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "#FFFFFF75",
  },

  label: {
    fontFamily: "Sora",
    fontSize: "13px",
    color: "#FFFFFF75",
  },

  span: {
    color: "#049260",
    cursor: "pointer",
  },
}));

//checkBox
export const StyledCheckBox = styled(Box)(() => ({
  '& input[type="checkbox"]': {
    appearance: "none",
    "-webkit-appearance": "none",
    "-moz-appearance": "none",
    width: "20px",
    height: "20px",
    border: "2px solid #ccc",
    borderRadius: "4px",
    outline: "none",
    cursor: "pointer",
    "&:checked": {
      backgroundColor: "#007bff",
    },
  },
}));
