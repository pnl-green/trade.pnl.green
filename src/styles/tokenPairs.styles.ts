import { Box, styled } from "@mui/material";

interface TokenPairsProps {
  tableISOpen?: boolean;
}

export const TokenPairsWrapper = styled(Box)<TokenPairsProps>((props) => ({
  display: "flex",
  flexDirection: "row",
  justifyContent: "flex-start",
  padding: "0 10px",
  width: "calc(100vw - 720px)",
  height: "55px",
  borderRadius: "5px",
  backgroundColor: "#171b26",
  gap: "25px",
  border: "1px solid rgba(255, 255, 255, 0.1)",

  ".pair_tokens": {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100px",
    height: "100%",
    fontFamily: "Sora",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
  },

  ".upDownIcon": {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    transform: props.tableISOpen ? "rotate(180deg)" : "rotate(0deg)",
    transition: "transform 0.3s ease-in-out",
    img: {
      width: "12px",
    },
  },

  ".pairDetails": {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "4px",

    span: {
      fontFamily: "Sora",
      fontSize: "13px",
      fontWeight: "300",
      color: "rgba(255, 255, 255, 0.5)",
    },

    "#toRed": {
      color: "#B04747",
    },

    "#toGreen": {
      color: "#3DBA3D",
    },

    ".value": {
      color: "#fff",
    },
  },

  "@media (max-width: 1535px)": {
    width: "calc(100vw - 400px)",
  },

  "@media (max-width: 899px)": {
    width: "calc(100vw - 70px)",
  },
}));

export const TokenPairsInfoTableWrapper = styled(Box)(() => ({
  display: "flex",
  flexDirection: "column",
  width: "694px",
  height: "348px",
  background: "#000000",
  borderRadius: "5px",
  border: "1px solid #D9D9D947",
  position: "absolute",
  zIndex: 1,
  top: "calc(100% + 2px)",
  left: "2px",
  transition: "all 0.3s ease-in-out",
}));
