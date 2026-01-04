//usecontext to pass common pair tokens across

import React, { createContext, useContext, useEffect, useState } from 'react';
import { ActiveAssetData, PairData } from '../../types/hyperliquid';
import { useAddress, useChainId } from '@thirdweb-dev/react';
import { useExchange } from './exchangeContext';

//default dummy token data
const defaultDummyTokenData: PairData | any = {
  pairs: 'SOL-USDC',
  assetId: '--',
  universe: {
    maxLeverage: '--',
    name: '--',
    onlyIsolated: '--',
    szDecimals: '--',
  },
  assetCtx: {
    dayNtlVlm: '--',
    funding: '--',
    impactPxs: ['--', '--'],
    markPx: '--',
    midPx: '--',
    openInterest: '--',
    oraclePx: '--',
    premium: '--',
    prevDayPx: '--',
  },
};

interface PairTokensProps {
  tokenPairs: string[];
  selectedPairsTokenData: PairData | any;
  setSelectPairsTokenData: React.Dispatch<
    React.SetStateAction<PairData | null>
  >;
  pair: string;
  setPair: React.Dispatch<React.SetStateAction<string>>;

  tokenPairData: any;
  allTokenPairs: any;

  assetId: string | number;
  setAssetId: React.Dispatch<React.SetStateAction<string | number>>;
  activeAssetData?: ActiveAssetData;
  setActiveAssetData?: React.Dispatch<React.SetStateAction<ActiveAssetData>>;
}

export const PairTokensContext = createContext({} as PairTokensProps);

export const usePairTokensContext = () => {
  const context = useContext(PairTokensContext);
  if (!context) {
    throw new Error(
      'usePairTokensContext must be used within a PairTokensProvider'
    );
  }
  return context;
};

const normalizeQuote = (quote?: string) => {
  const upperQuote = (quote || '').toUpperCase();

  if (upperQuote === 'USDCC' || upperQuote === 'USD') {
    return 'USDC';
  }

  return upperQuote;
};

const normalizePairName = (pair?: string | null) => {
  if (!pair) return pair || '';

  const [base, quote] = pair.split('-');
  const normalizedQuote = normalizeQuote(quote);

  return quote ? `${base}-${normalizedQuote}` : base;
};

const PairTokensProvider = ({ children }: { children: React.ReactNode }) => {
  //------Hooks------
  const userAddress = useAddress();
  const chainId = useChainId();
  const { currentExchangeId } = useExchange();

  const [loadingWebData2, setLoadingWebData2] = useState<boolean>(true);
  const [tokenPairData, setTokenPairData] = useState([]); //all token pair data
  const [allTokenPairs, setAllTokenPairs] = useState([]); //all token pair data
  const [exchangePairs, setExchangePairs] = useState<Record<string, any[]>>({}); // Store pairs per exchange
  const [selectedPairsTokenData, setSelectPairsTokenData] =
    useState<PairData | null>(defaultDummyTokenData);
  //single token pair data
  const [tokenPairs, setTokenPairs] = useState<string[]>([]); //token pairs eg [BTC,USD]
  const [pair, setPair] = useState<string>(''); //token pair eg BTC-USDC
  const [assetId, setAssetId] = useState<string | number>(0); //asset id
  const [activeAssetData, setActiveAssetData] =
    useState<ActiveAssetData | null>(null); //active asset data

  //------Local storage items------
  const savedAssetId = sessionStorage.getItem('assetId');
  const savedSelectPairsTokenData = sessionStorage.getItem(
    'selectPairsTokenData'
  );

  //split token pairs with - and return both tokens
  const splitTokenPairs = () => {
    try {
      if (selectedPairsTokenData) {
        const normalizedPair = normalizePairName(selectedPairsTokenData?.pairs);
        const splitPairs = normalizedPair?.split('-');
        const [base, quote] = splitPairs || [];

        setTokenPairs(
          [base, normalizeQuote(quote)].filter(Boolean) as string[]
        );

        return splitPairs;
      }
    } catch (error) {
      console.error('Error splitting token pairs', error);
    }
  };

  useEffect(() => {
    if (tokenPairs?.length) {
      setPair(`${tokenPairs[0]}${tokenPairs[1] ? `-${tokenPairs[1]}` : ''}`);
    }
  }, [tokenPairs]);

  useEffect(() => {
    splitTokenPairs();
  }, [selectedPairsTokenData]);

  // Fetch markets for all exchanges via CCXT API
  useEffect(() => {
    if (!currentExchangeId) return;
    const controller = new AbortController();

    const fetchMarkets = async (exchange: string) => {
      try {
        const rawResponse = await fetch(`/ccxt/${exchange}/markets`, {
          signal: controller.signal,
        });
        
        if (!rawResponse.ok) {
          console.error(`Failed to fetch ${exchange} markets: ${rawResponse.status} ${rawResponse.statusText}`);
          return;
        }
        
        const res = await rawResponse.json();
        
        // Check for errors in CCXT responses
        if (!res.success && res.error) {
          console.error(`Failed to fetch ${exchange} markets:`, res.error);
          return;
        }
        
        const markets = res?.data || [];

        const mapped = markets
          .filter((market: any) => market.type === 'spot' && market.active)
          .map((market: any, index: number) => ({
            pairs: normalizePairName(`${market.base}-${market.quote}`),
            assetId: index,
            universe: {
              name: market.base,
              maxLeverage: market.limits?.leverage?.max ?? '--',
              szDecimals: market.precision?.amount ?? '--',
              onlyIsolated: '--',
            },
            assetCtx: {
              dayNtlVlm: market.info?.dayNtlVlm || '--',
              funding: market.info?.funding || '--',
              impactPxs: market.info?.impactPxs || ['--', '--'],
              markPx: market.info?.markPx || market.info?.last || '--',
              midPx: market.info?.midPx || market.info?.last || '--',
              openInterest: market.info?.openInterest || '--',
              oraclePx: market.info?.oraclePx || '--',
              premium: market.info?.premium || '--',
              prevDayPx: market.info?.prevDayPx || '--',
            },
          }));

        setExchangePairs((prev) => ({
          ...prev,
          [exchange]: mapped,
        }));
      } catch (error) {
        if ((error as any).name !== 'AbortError') {
          console.error(`Failed to fetch ${exchange} markets`, error);
        }
      }
    };

    fetchMarkets(currentExchangeId);

    return () => controller.abort();
  }, [currentExchangeId]);

  useEffect(() => {
    const pairs = exchangePairs[currentExchangeId] || [];
    setTokenPairData(pairs);
    setAllTokenPairs(pairs);
    if (pairs[0]) {
      setSelectPairsTokenData(pairs[0]);
      sessionStorage.setItem('assetId', JSON.stringify(0));
      sessionStorage.setItem(
        'selectPairsTokenData',
        JSON.stringify(pairs[0])
      );
    }
  }, [currentExchangeId, exchangePairs]);

  // Note: Active asset data (user-specific trading data) would need to be fetched
  // via exchange-specific APIs. For now, this is disabled as we're focusing on public data.
  // This can be re-enabled when exchange-specific trading APIs are integrated.

  // set data from local storage
  useEffect(() => {
    if (savedAssetId && savedSelectPairsTokenData) {
      setAssetId(savedAssetId);
      try {
        const parsed = JSON.parse(savedSelectPairsTokenData);
        const updatedPairs = normalizePairName(parsed?.pairs);
        setSelectPairsTokenData(
          updatedPairs ? { ...parsed, pairs: updatedPairs } : parsed
        );
      } catch (error) {
        console.error('Failed to parse stored pair data', error);
      }
    }
  }, [savedAssetId, savedSelectPairsTokenData]);

  // Set default token pair data on first load
  useEffect(() => {
    if (!loadingWebData2 && (!savedAssetId || !savedSelectPairsTokenData) && tokenPairData[0]) {
      sessionStorage.setItem('assetId', JSON.stringify(0));
      sessionStorage.setItem(
        'selectPairsTokenData',
        JSON.stringify(tokenPairData[0])
      );
      setSelectPairsTokenData(tokenPairData[0]);
    }
  }, [loadingWebData2, savedAssetId, savedSelectPairsTokenData, tokenPairData]);

  return (
    <PairTokensContext.Provider
      value={{
        tokenPairs,
        selectedPairsTokenData,
        setSelectPairsTokenData,
        pair,
        setPair,
        tokenPairData,
        allTokenPairs,
        assetId,
        setAssetId,
        activeAssetData: activeAssetData || undefined, // Update the type to include null
      }}
    >
      {children}
    </PairTokensContext.Provider>
  );
};

export default PairTokensProvider;
