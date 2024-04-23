import React from 'react';
import { TokenPairsWrapper } from '@/styles/tokenPairs.styles';
import { Box } from '@mui/material';
import UpDownIcon from '../../../public/upDownIcon';
import { usePairTokensContext } from '@/context/pairTokensContext';

interface SingleTokenPairInfoProps {
  tableISOpen: boolean;
  toggleTablePairs: () => void;
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
}: SingleTokenPairInfoProps) => {
  const { tokenPairData, assetId } = usePairTokensContext();

  return (
    <TokenPairsWrapper tableISOpen={tableISOpen}>
      <Box className="pair_tokens" onClick={toggleTablePairs}>
        <span>{tokenPairData[assetId]?.pairs}</span>
        <div className="upDownIcon">
          <UpDownIcon />
        </div>
      </Box>

      <PairDetail
        label="Mark Price"
        value={tokenPairData[assetId]?.assetCtx?.markPx}
      />
      <PairDetail
        label="Oracle Price"
        value={tokenPairData[assetId]?.assetCtx?.oraclePx}
      />
      <Box className="pairDetails">
        <span>
          24hr change(<span id="toRed">in % </span>and <span id="toRed">$</span>
          )
        </span>
        <span className="value" id="toRed">
          {tokenPairData[assetId]?.hr24change
            ? tokenPairData[assetId]?.hr24change
            : '--'}
        </span>
      </Box>
      <PairDetail
        label="24hr Volume"
        value={
          tokenPairData[assetId]?.volume ? tokenPairData[assetId]?.volume : '--'
        }
      />
      <PairDetail
        label="OI"
        value={tokenPairData[assetId]?.assetCtx?.openInterest}
      />
      <Box className="pairDetails">
        <span>Funding/Funding Countdown</span>
        <span className="value">
          <span id="toGreen">
            {tokenPairData[assetId]?.funding}&nbsp;&nbsp;{' '}
          </span>
          &nbsp;&nbsp;
          {tokenPairData[assetId]?.countDown}
        </span>
      </Box>
    </TokenPairsWrapper>
  );
};

export default SingleTokenPairInfo;
