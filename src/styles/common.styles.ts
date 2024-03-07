import { Box, Button, Select, styled } from "@mui/material";

export const SelectItems = styled(Select)({
  display: "flex",
  minWidth: "64px",
  width: "100%",
  maxWidth: "105px",
  height: "35px",
  background: "#171b26",
  color: "#D1D5DB",

  fontSize: "13px",
  fontWeight: "400",
  fontFamily: "Sora",
  position: "relative",

  "&.MuiInputBase-root": {
    padding: "2px",
    "& fieldset": {},
    "&:hover fieldset": {
      borderColor: "#049260",
      borderWidth: "1px",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#049260",
      borderWidth: "1px",
      display: "none",
    },
    "& .MuiOutlinedInput-input": {
      display: "flex",
      alignItems: "center",
      padding: "0 !important",
    },
    "& .MuiSelect-icon": {
      color: "#D1D5DB",
      //   right: "-20px",
    },
  },

  //   "@media screen and (max-width: 1050px)": {
  //     width: "100%",
  //   },
});

//buttons
export const TextBtn = styled(Button)(() => ({
  color: "#fff",
  backgroundColor: "#000",
  textTransform: "none",
  fontFamily: "inter",
  position: "relative",

  "&:hover": {
    backgroundColor: "#000",
  },

  "::after": {
    position: "absolute",
    content: "''",
    display: "block",
    width: "100%",
    height: "2px",
    backgroundColor: "#049260",
    top: "100%",
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

export const GreenBtn = styled(Button)(() => ({
  color: "#fff",
  backgroundColor: "#049260",
  textTransform: "none",
  fontFamily: "Montserrat",

  "&:hover": {
    backgroundColor: "#049260",
  },
}));

export const BuySellBtn = styled(Button)(() => ({
  color: "#fff",
  backgroundColor: "#171b26",
  textTransform: "none",
  fontFamily: "Montserrat",
  padding: "5px 5px !important",

  "&.buyBtn": {
    backgroundColor: "#049260",
  },

  "&.sellBtn": {
    backgroundColor: "#B04747",
  },
}));

//flex items
export const FlexItems = styled(Box)(() => ({
  display: "flex",
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  span: { fontSize: "13px", fontWeight: "400", fontFamily: "Sora" },
}));
