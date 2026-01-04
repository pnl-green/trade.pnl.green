import React, { useEffect, useState } from 'react';
import { TokenPairsWrapper } from '@/styles/tokenPairs.styles';
import { Box } from '@mui/material';
import UpDownIcon from '../../../public/upDownIcon';
import { usePairTokensContext } from '@/context/pairTokensContext';
import Tooltip from '../ui/Tooltip';
import { useExchange } from '@/context/exchangeContext';

interface SingleTokenPairInfoProps {
  tableISOpen: boolean;
  toggleTablePairs: () => void;
}

const PairDetail = ({ label, subLabel, value, isRed }: any) => (
  <Box className="metric">
    <span className="label">
      {label}
      {subLabel && <span className="sublabel">{subLabel}</span>}
    </span>
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
  const { currentExchangeId } = useExchange();

  const [assetInfo, setAssetInfo] = useState<any>(null);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const pair = selectedPairsTokenData?.pairs || tokenPairData[assetId]?.pairs;
      if (!pair) return;

      const url = `/ccxt/${currentExchangeId}/asset-info?symbol=${encodeURIComponent(pair)}`;

        const rawResponse = await fetch(url);
        if (!rawResponse.ok) {
          console.error(`Failed to fetch asset info: ${rawResponse.status} ${rawResponse.statusText}`);
          setAssetInfo(null);
          return;
        }
        
        const response = await rawResponse.json();
        
        // Check for errors in CCXT responses
        if (!response.success && response.error) {
          console.error('CCXT API error:', response.error);
          console.error('This might be due to:', {
            'Missing API keys': 'Some exchanges require API keys even for public data',
            'CCXT service not running': 'Check if the ccxt-service is running on port 4001',
            'Invalid symbol': 'The trading pair might not exist on this exchange',
            'Network issue': 'Check your connection to the backend service'
          });
          setAssetInfo(null);
          return;
        }
        
        const data = response?.data || response;
        setAssetInfo(data);
      } catch (error) {
        console.error('Failed to fetch asset info', error);
        setAssetInfo(null);
      }
    };

    fetchInfo();
    const interval = setInterval(fetchInfo, 10_000);

    return () => clearInterval(interval);
  }, [assetId, selectedPairsTokenData, tokenPairData, currentExchangeId]);

  const merged: any = tokenPairData.concat(allTokenPairs);

  const pairDataInformation = () => {
    if (assetInfo) return assetInfo;

    if (merged.length > 0) {
      return selectedPairsTokenData;
    }
    return tokenPairData[assetId];
  };

  const metrics = [
    {
      label: 'Mark Price',
      value: assetInfo?.markPrice ?? assetInfo?.last ?? pairDataInformation()?.assetCtx?.markPx,
      tooltip:
        "Mark Price is Intelayer's reference price for this market. It is usually a fair value index used for PnL and liquidation calculations.",
    },
    {
      label: 'Oracle Price',
      value: assetInfo?.oraclePrice ?? pairDataInformation()?.assetCtx?.oraclePx ?? '--',
      tooltip:
        "Oracle Price is the external reference price provided by the venue's oracle. It is used for funding and risk checks, not necessarily for order execution.",
    },
    {
      label: '24hr Change',
      subLabel: '(in % and $)',
      value:
        assetInfo?.change24hPct !== undefined && assetInfo?.change24hPct !== null
          ? `${Number(assetInfo?.change24hPct).toFixed(2)}% ($${Number(assetInfo?.change24hUsd ?? 0).toFixed(2)})`
          : assetInfo?.percentage !== undefined && assetInfo?.percentage !== null
            ? `${Number(assetInfo?.percentage).toFixed(2)}% ($${Number(assetInfo?.change ?? 0).toFixed(2)})`
            : pairDataInformation()?.hr24change
              ? pairDataInformation()?.hr24change
              : '--',
      tooltip:
        '24hr Change shows how much the mark price has moved in the last 24 hours, in both percentage and absolute terms.',
      isRed: true,
    },
    {
      label: '24hr Volume',
      value:
        assetInfo?.volume24h ??
        assetInfo?.baseVolume ??
        assetInfo?.quoteVolume ??
        pairDataInformation()?.volume ??
        '--',
      tooltip: '24hr Volume is the total traded volume in this market over the last 24 hours.',
    },
    {
      label: 'OI',
      value:
        assetInfo?.openInterest ??
        pairDataInformation()?.openInterest ??
        pairDataInformation()?.assetCtx?.openInterest ??
        '--',
      tooltip:
        'OI (Open Interest) is the notional value of all open positions in this market. It is a proxy for market activity and crowding.',
    },
    {
      label: 'Funding',
      subLabel: 'Countdown',
      value: (
        <span className="value">
          <span id="toGreen">{(assetInfo?.fundingRate ?? assetInfo?.funding ?? pairDataInformation()?.funding) || '--'}&nbsp;&nbsp;</span>
          {(assetInfo?.fundingCountdown ?? pairDataInformation()?.fundingCountdown ?? pairDataInformation()?.countDown) || '--'}
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
          {metrics.map(({ label, subLabel, value, tooltip, isRed }) => (
            <Tooltip key={label} content={tooltip}>
              <PairDetail
                label={label}
                subLabel={subLabel}
                value={value}
                isRed={isRed}
              />
            </Tooltip>
          ))}
        </Box>
      </TokenPairsWrapper>
  );
};

export default SingleTokenPairInfo;
