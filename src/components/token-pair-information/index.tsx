import React, { useState } from "react";
import SingleTokenPairInfo from "./singleTokenPairInfo";
import TokenPairsInfoTable, { PairData } from "./tokenPairsInfoTable";
import { Box } from "@mui/material";

const TokenPairInformation = () => {
  const [tableISOpen, setTableISOpen] = useState(false);
  const [selectedPairsToken, setSelectPairsToken] = useState<PairData | null>(
    null
  );
  const toggleTablePairs = () => {
    setTableISOpen((prev) => !prev);
  };

  return (
    <Box sx={{ position: "relative" }}>
      <SingleTokenPairInfo
        tableISOpen={tableISOpen}
        toggleTablePairs={toggleTablePairs}
        selectPairsToken={selectedPairsToken}
      />
      {tableISOpen && (
        <TokenPairsInfoTable
          handleClose={toggleTablePairs}
          selectPairsToken={selectedPairsToken}
          setSelectPairsToken={setSelectPairsToken}
        />
      )}
    </Box>
  );
};

export default TokenPairInformation;
