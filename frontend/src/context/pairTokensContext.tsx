// Shares token pair metadata and live asset state across the dashboard.

import React, { createContext, useContext, useEffect, useState } from 'react';
import { ActiveAssetData, PairData, tokenPairs } from '../../types/hyperliquid';
import { useHyperLiquidContext } from './hyperLiquidContext';
import { useAddress, useChainId } from '@thirdweb-dev/react';

//default dummy token data
const defaultDummyTokenData: PairData | any = {
  pairs: 'SOL-USD',
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
  tokenPairs: tokenPairs[];
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

// Provider that streams Hyperliquid token metadata and caches selections.
const PairTokensProvider = ({ children }: { children: React.ReactNode }) => {
  //------Hooks------
  const userAddress = useAddress();
  const chainId = useChainId();
  const { hyperliquid } = useHyperLiquidContext();

  // Local caches for token pair metadata, user selection, and active asset stats.
  const [loadingWebData2, setLoadingWebData2] = useState<boolean>(true);
  const [tokenPairData, setTokenPairData] = useState([]); //all token pair data
  const [allTokenPairs, setAllTokenPairs] = useState([]); //all token pair data
  const [selectedPairsTokenData, setSelectPairsTokenData] =
    useState<PairData | null>(defaultDummyTokenData);
  //single token pair data
  const [tokenPairs, setTokenPairs] = useState<tokenPairs | any>({}); //token pairs eg [BTC,USD]
  const [pair, setPair] = useState<string>(''); //token pair eg BTC-USD
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
        const splitPairs = selectedPairsTokenData?.pairs?.split('-');
        setTokenPairs(splitPairs);

        return splitPairs;
      }
    } catch (error) {
      console.error('Error splitting token pairs', error);
    }
  };

  useEffect(() => {
    // Mirror the parsed symbol (e.g., BTC) so UI components can reference it directly.
    setPair(`${tokenPairs[0]}`);
  }, [tokenPairs]);

  useEffect(() => {
    // Whenever the selected pair changes, refresh the derived token symbol tuple.
    splitTokenPairs();
  }, [selectedPairsTokenData]);

  useEffect(() => {
    // Stream the public webData2 feed to derive universe metadata for all assets.
    const ws = new WebSocket(
      chainId === 42161
        ? 'wss://api.hyperliquid.xyz/ws'
        : 'wss://api.hyperliquid-testnet.xyz/ws'
    );

    // When the WebSocket connection is open, send the subscribe message
    ws.onopen = () => {
      const message = JSON.stringify({
        method: 'subscribe',
        subscription: {
          type: 'webData2',
          user: '0x0000000000000000000000000000000000000000',
        },
      });
      ws.send(message);
    };

    // Listen for messages from the WebSocket server
    ws.onmessage = (event) => {
      setLoadingWebData2(true);
      const message = JSON.parse(event.data);
      const data = message.data;

      if (message.channel === 'webData2') {
        if (data) {
          setLoadingWebData2(false);

          hyperliquid
            .metaAndAssetCtxs(data.meta, data.assetCtxs)
            .then((result) => {
              const tokens = result.map( (r: any) => r.universe.name );
              const tokenPair = tokens.flatMap( (token, i) => 
                tokens
                  .filter( (otherToken) => otherToken !== token )
                  .map( (otherToken) => {
                  const tokenData = result.find((r: any) => r.universe.name === token);
                    return {
                      pairs: `${token}-${otherToken}`,
                      ...tokenData
                    }
                  })
              )

              const newData = result.map((res: any) => {
                return {
                  pairs: `${res.universe.name}-USD`,
                  ...res,
                };
              });
              
              setAllTokenPairs(tokenPair as any);
              setTokenPairData(newData as any);
            });
        }
      } else if (message.channel === 'error') {
        setLoadingWebData2(false);
        console.error('Error:', message.data);
      }
    };

    // Handle WebSocket errors
    ws.onerror = (error) => {
      console.error('WebSocket Error:', error);
    };

    // Clean up the WebSocket connection when the component unmounts
    return () => {
      ws.close();
    };
  }, [hyperliquid]);

  //get active assetData with current leverage value
  useEffect(() => {
    if (!userAddress) return;

    // Create a new WebSocket connection
    const ws = new WebSocket(
      chainId === 42161
        ? 'wss://api.hyperliquid.xyz/ws'
        : 'wss://api.hyperliquid-testnet.xyz/ws'
    );

    // When the WebSocket connection is open, send the subscribe message
    ws.onopen = () => {
      const message = JSON.stringify({
        method: 'subscribe',
        subscription: {
          type: 'activeAssetData',
          user: userAddress,
          coin: `${tokenPairs[0]}`,
        },
      });
      ws.send(message);
    };

    // Listen for messages from the WebSocket server
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      const data = message.data;

      if (message.channel === 'activeAssetData') {
        if (data) {
          setActiveAssetData(data);
        }
      } else if (message.channel === 'error') {
        console.error('Error:', message.data);
      }
    };

    // Handle WebSocket errors
    ws.onerror = (error) => {
      console.error('WebSocket Error:', error);
    };

    // Clean up the WebSocket connection when the component unmounts
    return () => {
      ws.close();
    };
  }, [tokenPairData]);

  // Restore the last viewed market from session storage so tabs persist.
  useEffect(() => {
    if (savedAssetId && savedSelectPairsTokenData) {
      setAssetId(savedAssetId);
      setSelectPairsTokenData(JSON.parse(savedSelectPairsTokenData));
    }
  }, [savedAssetId, savedSelectPairsTokenData]);

  // Set default token pair data on first load
  useEffect(() => {
    if (!loadingWebData2 && (!savedAssetId || !savedSelectPairsTokenData)) {
      // setSelectPairsTokenData(tokenPairData[0]); // Single token pair data
      // setAssetId(0); // Asset id

      //store to local storage on first load
      sessionStorage.setItem('assetId', JSON.stringify(0));
      sessionStorage.setItem(
        'selectPairsTokenData',
        JSON.stringify(tokenPairData[0])
      );
    }
  }, [loadingWebData2, savedAssetId, savedSelectPairsTokenData]);

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
      {/* Expose all pair-related helpers to any component below in the tree. */}
      {children}
    </PairTokensContext.Provider>
  );
};

export default PairTokensProvider;
