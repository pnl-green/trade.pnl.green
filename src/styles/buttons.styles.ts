import { Button, styled } from "@mui/material";

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
