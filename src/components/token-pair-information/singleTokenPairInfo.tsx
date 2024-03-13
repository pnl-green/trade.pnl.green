import React from "react";
import { TokenPairsWrapper } from "@/styles/tokenPairs.styles";
import { Box } from "@mui/material";

interface SingleTokenPairInfoProps {
  tableISOpen: boolean;
  toggleTablePairs: () => void;
}

const PairDetail = ({ label, value, isRed }: any) => (
  <Box className="pairDetails">
    <span>{label}</span>
    <span className={isRed ? "value toRed" : "value"}>{value}</span>
  </Box>
);

const SingleTokenPairInfo = ({
  tableISOpen,
  toggleTablePairs,
}: SingleTokenPairInfoProps) => {
  return (
    <TokenPairsWrapper tableISOpen={tableISOpen}>
      <Box className="pair_tokens" onClick={toggleTablePairs}>
        <span>
          {"ETH"}-{"USD"}
        </span>
        <div className="upDownIcon">
          <img src="/upDownIcon.svg" alt="" />
        </div>
      </Box>

      <PairDetail label="Mark Price" value="32000" />
      <PairDetail label="Oracle Price" value="32000" />
      <Box className="pairDetails">
        <span>
          24hr change(<span id="toRed">in % </span>and <span id="toRed">$</span>
          )
        </span>
        <span className="value" id="toRed">
          {"-0.000396"} / {"-2.14"}%
        </span>
      </Box>
      <PairDetail label="24hr Volume" value="32000" />
      <PairDetail label="OI" value="32000" />
      <Box className="pairDetails">
        <span>Funding/Funding Countdown</span>
        <span className="value">
          <span id="toGreen">{"0.012"}%</span>&nbsp;&nbsp;{"00.55.52"}
        </span>
      </Box>
    </TokenPairsWrapper>
  );
};

export default SingleTokenPairInfo;
