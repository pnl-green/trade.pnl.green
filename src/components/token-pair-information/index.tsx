import React from "react";
import SingleTokenPairInfo from "./singleTokenPairInfo";
import TokenPairsInfoTable from "./tokenPairsInfoTable";
import { Box } from "@mui/material";

const TokenPairInformation = () => {
  const [tableISOpen, setTableISOpen] = React.useState(false);
  const toggleTablePairs = () => {
    setTableISOpen((prev) => !prev);
  };
  return (
    <Box sx={{ position: "relative" }}>
      <SingleTokenPairInfo
        tableISOpen={tableISOpen}
        toggleTablePairs={toggleTablePairs}
      />

      {tableISOpen && <TokenPairsInfoTable />}
    </Box>
  );
};

export default TokenPairInformation;
