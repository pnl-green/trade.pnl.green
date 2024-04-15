import React, { useState } from 'react';
import { TokenPairsWrapper } from '@/styles/tokenPairs.styles';
import { Box } from '@mui/material';
import { PairData } from '../../../types/hyperliquid';

interface SingleTokenPairInfoProps {
  tableISOpen: boolean;
  toggleTablePairs: () => void;
  selectPairsToken?: PairData | null;
}

const PairDetail = ({ label, value, isRed }: any) => (
  <Box className="pairDetails">
    <span>{label}</span>
    <span className={isRed ? 'value toRed' : 'value'}>{value}</span>
  </Box>
);

const SingleTokenPairInfo = ({
  tableISOpen,
  toggleTablePairs,
  selectPairsToken,
}: SingleTokenPairInfoProps) => {
  return (
    <TokenPairsWrapper tableISOpen={tableISOpen}>
      <Box className="pair_tokens" onClick={toggleTablePairs}>
        <span>{selectPairsToken?.symbol}</span>
        <div className="upDownIcon">
          <img src="/upDownIcon.svg" alt="" />
        </div>
      </Box>

      <PairDetail label="Mark Price" value={selectPairsToken?.markPrice} />
      <PairDetail label="Oracle Price" value={selectPairsToken?.oraclePrice} />
      <Box className="pairDetails">
        <span>
          24hr change(<span id="toRed">in % </span>and <span id="toRed">$</span>
          )
        </span>
        <span className="value" id="toRed">
          {selectPairsToken?.hr24change}
        </span>
      </Box>
      <PairDetail label="24hr Volume" value={selectPairsToken?.volume} />
      <PairDetail label="OI" value="32000" />
      <Box className="pairDetails">
        <span>Funding/Funding Countdown</span>
        <span className="value">
          <span id="toGreen">{selectPairsToken?.funding}&nbsp;&nbsp; </span>
          &nbsp;&nbsp;
          {selectPairsToken?.countDown}
        </span>
      </Box>
    </TokenPairsWrapper>
  );
};

export default SingleTokenPairInfo;
