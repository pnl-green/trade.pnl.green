import { Box, Checkbox, styled } from "@mui/material";

export const RiskManagerWrapper = styled(Box)(() => ({
  display: "flex",
  flexDirection: "column",
  gap: "10px",
  backgroundColor: "#13121296",
  width: "306px",
  height: "620px",
  padding: "10px",
  position: "relative",
  border: "2px solid rgba(255, 255, 255, 0.1)",
  borderRadius: "8px",
  // marginTop:"61px",

  ".captions": {
    display: "flex",
    padding: "5px",
    background: "#34484D",
    borderRadius: "5px",
    fontSize: "14px",
    fontWeight: "400",
    fontFamily: "Sora",
    cursor: "pointer",

    "&:hover": {
      background: "#0F1A1F",
    },
  },
}));

export const TabsWrapper = styled(Box)(() => ({
  display: "flex",
  flexDirection: "row",
  gap: "2px",
  width: "100%",
  height: "38px",
  paddingBottom: "1px",
  borderBottom: "1px solid #FFFFFF99",
}));

export const TabsButton = styled("button")(() => ({
  display: "flex",
  alignItems: "center",
  padding: "0 9px",
  color: "#FFFFFF99",
  backgroundColor: "transparent",
  border: "none",
  cursor: "pointer",
  position: "relative",

  fontSize: "13px",
  fontWeight: "400",
  fontFamily: "Sora",

  "::after": {
    position: "absolute",
    content: "''",
    display: "block",
    width: "100%",
    height: "2px",
    backgroundColor: "#049260",
    top: "100%",
    left: "0",
    transition: "transform 0.3s ease",
    transformOrigin: "right top",
    transform: "scaleX(0)",
    zindex: 2,
  },
  "&:hover::after": {
    transformOrigin: "left top",
    transform: "scaleX(1)",
  },

  "&.active::after": {
    transform: "scaleX(1)",
  },
}));

export const LiquidationWrapper = styled(Box)(() => ({
  display: "flex",
  flexDirection: "column",
  gap: "10px",
  padding: "20px 10px",
  borderTop: "1px solid #FFFFFF99",
  position: "absolute",
  bottom: "0",
  width: "100%",
  left: "0",

  ".items": {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",

    fontSize: "14px",
    fontWeight: "400",
    fontFamily: "Sora",
  },
}));

export const InputCheckBox = styled(Checkbox)(() => ({
  color: "#fff",
  padding: "0",

  "&.Mui-checked": {
    color: "#fff",
  },
}));

export const SelectItemsBox = styled(Box)(() => ({
  display: "flex",
  flexDirection: "row",
  justifyContent: "space-between",
  gap: "10px",
  width: "100%",
  height: "35px",
  borderRadius: "8px",
  background: "#171b26",
  marginTop: "10px",
  alignItems: "center",
  padding: "0 10px 0 5px",
  "*": {
    fontSize: "13px",
    fontWeight: "400",
    fontFamily: "Sora",
  },

  span: { fontSize: "12px" },
}));
