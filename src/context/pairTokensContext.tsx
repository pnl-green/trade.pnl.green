//usecontext to pass common pair tokens across

import React, { createContext, useContext, useEffect, useState } from 'react';
import { PairData, tokenPairs } from '../../types/hyperliquid';
import { pairDataArray } from './tabledummydata';

interface PairTokensProps {
  tokenPairs: tokenPairs[];
  setTokenPairs?: React.Dispatch<React.SetStateAction<tokenPairs[]>>;
  selectedPairsTokenData: PairData | null;
  setSelectPairsTokenData: React.Dispatch<
    React.SetStateAction<PairData | null>
  >;
  splitTokenPairs: (pair: string) => string[] | undefined;
  pair: string;
  setPair: React.Dispatch<React.SetStateAction<string>>;
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

export const PairTokensProvider = ({ children }: any) => {
  const [selectedPairsTokenData, setSelectPairsTokenData] =
    useState<PairData | null>(pairDataArray[0]);
  const [tokenPairs, setTokenPairs] = useState<tokenPairs | any>({});
  const [pair, setPair] = useState<string>('');

  //split token pairs with - and return both tokens
  const splitTokenPairs = () => {
    try {
      if (selectedPairsTokenData) {
        const splitPairs = selectedPairsTokenData?.symbol.split('-');
        setTokenPairs(splitPairs);
        return splitPairs;
      }
    } catch (error) {
      console.error('Error splitting token pairs', error);
    }
  };

  useEffect(() => {
    setPair(`${tokenPairs[0]}`);
  }, [tokenPairs]);

  useEffect(() => {
    splitTokenPairs();
  }, [selectedPairsTokenData]);

  return (
    <PairTokensContext.Provider
      value={{
        tokenPairs,
        selectedPairsTokenData,
        setSelectPairsTokenData,
        splitTokenPairs,
        pair,
        setPair,
      }}
    >
      {children}
    </PairTokensContext.Provider>
  );
};
