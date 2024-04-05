import { Box, styled } from "@mui/material";

export const ModalWrapper = styled(Box)(() => ({
  position: "fixed",
  zIndex: 9999,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  backdropFilter: "blur(2px)",
  width: "100vw",
  height: "100vh",
  left: 0,
  top: 0,
}));

export const InnerBox = styled(Box)(() => ({
  display: "flex",
  flexDirection: "column",
  position: "relative",
  width: "394px",
  minHeight: "206px",
  borderRadius: "5px",
  background: "#000",
  border: "1px solid rgba(255, 255, 255, 0.2)",
}));

export const IconsStyles = {
  position: "absolute",
  top: "10px",
  width: "20px",
  height: "20px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  right: "10px",
  cursor: "pointer",
};

export const MarginTabs = styled(Box)(() => ({
  display: "flex",
  flexDirection: "row",
  borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
}));
