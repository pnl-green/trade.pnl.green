import React, { useState } from "react";
import SingleTokenPairInfo from "./singleTokenPairInfo";
import TokenPairsInfoTable from "./tokenPairsInfoTable";
import { Box } from "@mui/material";
import { usePairTokensContext } from "@/context/pairTokensContext";

const TokenPairInformation = () => {
  const [tableISOpen, setTableISOpen] = useState(false);

  const { selectedPairsTokenData, setSelectPairsTokenData } = usePairTokensContext();

  const toggleTablePairs = () => {
    setTableISOpen((prev) => !prev);
  };

  return (
    <Box sx={{ position: "relative" }}>
      <SingleTokenPairInfo
        tableISOpen={tableISOpen}
        toggleTablePairs={toggleTablePairs}
        selectPairsToken={selectedPairsTokenData}
      />
      {tableISOpen && (
        <TokenPairsInfoTable
          handleClose={toggleTablePairs}
          selectPairsToken={selectedPairsTokenData}
          setSelectPairsToken={setSelectPairsTokenData}
        />
      )}
    </Box>
  );
};

export default TokenPairInformation;
