import React from 'react';
import { TokenPairsWrapper } from '@/styles/tokenPairs.styles';
import { Box } from '@mui/material';
import UpDownIcon from '../../../public/upDownIcon';
import { usePairTokensContext } from '@/context/pairTokensContext';
import Tooltip from '../ui/Tooltip';

interface SingleTokenPairInfoProps {
  tableISOpen: boolean;
  toggleTablePairs: () => void;
}

const PairDetail = ({ label, value, isRed }: any) => (
  <Box className="metric">
    <span className="label">{label}</span>
    {React.isValidElement(value) ? (
      value
    ) : (
      <span className={isRed ? 'value toRed' : 'value'}>{value}</span>
    )}
  </Box>
);

const SingleTokenPairInfo = ({
  tableISOpen,
  toggleTablePairs,
}: SingleTokenPairInfoProps) => {
  const { tokenPairData, allTokenPairs, assetId, selectedPairsTokenData } =
    usePairTokensContext();

  let merged: any = tokenPairData;
  merged = merged.concat(allTokenPairs);

  const pairDataInformation = () => {
    if (merged.length > 0) {
      return selectedPairsTokenData;
    } else {
      return tokenPairData[assetId];
    }
  };

  const metrics = [
    {
      label: 'Mark Price',
      value: pairDataInformation()?.assetCtx?.markPx,
      tooltip:
        "Mark Price is Intelayer's reference price for this market. It is usually a fair value index used for PnL and liquidation calculations.",
    },
    {
      label: 'Oracle Price',
      value: pairDataInformation()?.assetCtx?.oraclePx,
      tooltip:
        "Oracle Price is the external reference price provided by the venue's oracle. It is used for funding and risk checks, not necessarily for order execution.",
    },
    {
      label: '24hr change (in % and $)',
      value: pairDataInformation()?.hr24change
        ? pairDataInformation()?.hr24change
        : '--',
      tooltip:
        '24hr Change shows how much the mark price has moved in the last 24 hours, in both percentage and absolute terms.',
      isRed: true,
    },
    {
      label: '24hr Volume',
      value: pairDataInformation()?.volume ? pairDataInformation()?.volume : '--',
      tooltip: '24hr Volume is the total traded volume in this market over the last 24 hours.',
    },
    {
      label: 'OI',
      value: pairDataInformation()?.assetCtx?.openInterest,
      tooltip:
        'OI (Open Interest) is the notional value of all open positions in this market. It is a proxy for market activity and crowding.',
    },
    {
      label: 'Funding / Funding Countdown',
      value: (
        <span className="value">
          <span id="toGreen">{pairDataInformation()?.funding}&nbsp;&nbsp;</span>
          {pairDataInformation()?.countDown}
        </span>
      ),
      tooltip:
        'Funding shows the predicted funding rate for this period and the countdown until the next funding payment.',
    },
  ];

  return (
    <TokenPairsWrapper tableISOpen={tableISOpen}>
      <Box className="pair-section" onClick={toggleTablePairs}>
        <span className="pair-symbol">{pairDataInformation()?.pairs}</span>
        <div className="upDownIcon">
          <UpDownIcon />
        </div>
      </Box>

      <Box className="metrics" component="div">
        {metrics.map(({ label, value, tooltip, isRed }) => (
          <Tooltip key={label} content={tooltip}>
            <PairDetail label={label} value={value} isRed={isRed} />
          </Tooltip>
        ))}
      </Box>
    </TokenPairsWrapper>
  );
};

export default SingleTokenPairInfo;
