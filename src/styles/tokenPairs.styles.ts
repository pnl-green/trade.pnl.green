import { Box, styled } from "@mui/material";

interface TokenPairsProps {
  tableISOpen?: boolean;
}

export const TokenPairsWrapper = styled(Box)<TokenPairsProps>((props) => ({
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  padding: "0 10px",
  width: "calc(100vw - 720px)",
  height: "55px",
  borderRadius: "5px",
  backgroundColor: "#171b26",
  border: "1px solid rgba(255, 255, 255, 0.1)",

  ".pair_tokens": {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    width: "100px",
    height: "100%",
    fontFamily: "Sora",
    fontSize: "16px",
    fontWeight: "600",
  },

  ".upDownIcon": {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: "5px",
    transform: props.tableISOpen ? "rotate(180deg)" : "rotate(0deg)",

    img: {
      width: "10px",
      height: "10px",
    },
  },

  "@media (max-width: 1535px)": {
    width: "calc(100vw - 400px)",
  },

  "@media (max-width: 899px)": {
    width: "calc(100vw - 70px)",
  },
}));
