import { TokenPairsWrapper } from "@/styles/tokenPairs.styles";
import { Box } from "@mui/material";
import React from "react";

const TokenPairInformation = () => {
  return (
    <TokenPairsWrapper>
      <Box className="pair_tokens">
        <span>
          {"ETH"}-{"USD"}
        </span>
      </Box>
    </TokenPairsWrapper>
  );
};

export default TokenPairInformation;
