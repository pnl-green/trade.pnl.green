import { Box, styled } from "@mui/material";

export const OrderBookContainer = styled(Box)(() => ({
  display: "flex",
  flexDirection: "column",
  width: "310px",
  height: "570px",
  borderRadius: "5px",
  overflowX: "hidden",
  overflowY: "auto",
  border: "2px solid rgba(255, 255, 255, 0.1)",
  // marginTop:"61px"
  backgroundColor: "#13121296",
}));

export const OrderBookTabsWrapper = styled(Box)(() => ({
  display: "flex",
  flexDirection: "row",
  justifyContent: "space-around",
  gap: "10px",
  padding: "10px 20px 0px 20px",
  width: "100%",
}));

export const SpreadAndPairSelects = styled(Box)(() => ({
  display: "flex",
  flexDirection: "row",
  justifyContent: "space-between",
  gap: "10px",
  padding: "4px 30px",
  width: "100%",
}));

export const ItemsSelect = styled("select")(() => ({
  //   width: "max-content",
  height: "30px",
  padding: "5px",
  borderRadius: "5px",
  backgroundColor: "#131212",
  color: "#fff",
  border: "none",
  cursor: "pointer",
}));

export const OrderBookTable = styled("table")(() => ({
  width: "100%",
  borderCollapse: "collapse",

  thead: {
    color: "#FFFFFF99",
    fontSize: "13px",
    fontWeight: "400",
    fontFamily: "Sora",
    width: "100%",
    textAlign: "center",
    th: {},
  },

  ".spread": {
    th: {
      backgroundColor: "#2C2E2D",
    },
  },

  th: {
    padding: "5px",
  },

  td: {
    position: "relative",
    padding: "4px 5px",
  },

  tbody: {
    textAlign: "center",
    fontSize: "10px",
    fontWeight: "400",
    fontFamily: "Sora",
    color: "#FFFFFF",
  },
  tr: {
    position: "relative",

    "&:hover": {
      backgroundColor: "#0F1A1F",
      cursor: "pointer",
    },
  },
}));

interface TablerowsProps {
  type?: string;
  width?: any;
}

export const Tablerows = styled("tr")<TablerowsProps>((props) => ({
  position: "relative",
  zIndex: 1,

  ".first-column": {
    color: props.type === "bids" ? "rgb(0, 255, 0)" : "rgb(255, 0, 0)",
  },

  "::after": {
    content: "''",
    position: "absolute",
    display: "block",
    top: "50%",
    transform: "translateY(-50%)",
    left: "0",
    width: `${props.width}%`,
    height: "90%",
    zIndex: -1,
    backgroundColor:
      props.type === "bids" ? "rgba(0, 255, 0, 0.3)" : "rgba(255, 0, 0, 0.3)",
  },
}));
