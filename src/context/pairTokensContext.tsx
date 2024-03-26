//usecontext to pass common pair tokens across

import React, { createContext, useContext, useEffect, useState } from "react";
import { PairData, tokenPairs } from "../../types";
import { pairDataArray } from "./pairDataArray-dummydata";

interface PairTokensProps {
  tokenPairs: tokenPairs[];
  setTokenPairs?: React.Dispatch<React.SetStateAction<tokenPairs[]>>;
  selectedPairsTokenData: PairData | null;
  setSelectPairsTokenData: React.Dispatch<
    React.SetStateAction<PairData | null>
  >;
  splitTokenPairs: (pair: string) => string[] | undefined;
}

export const PairTokensContext = createContext({} as PairTokensProps);

export const usePairTokens = () => {
  const context = useContext(PairTokensContext);
  if (!context) {
    throw new Error("usePairTokens must be used within a PairTokensProvider");
  }
  return context;
};

export const PairTokensProvider = ({ children }: any) => {
  const [selectedPairsTokenData, setSelectPairsTokenData] =
    useState<PairData | null>(pairDataArray[0]);
  const [tokenPairs, setTokenPairs] = useState<tokenPairs | any>({});

  //split token pairs with - and return both tokens
  const splitTokenPairs = () => {
    try {
      console.log(selectedPairsTokenData);
      if (selectedPairsTokenData) {
        const splitPairs = selectedPairsTokenData?.symbol.split("-");
        setTokenPairs(splitPairs);
        return splitPairs;
      }
    } catch (error) {
      console.error("Error splitting token pairs", error);
    }
  };

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
      }}
    >
      {children}
    </PairTokensContext.Provider>
  );
};
