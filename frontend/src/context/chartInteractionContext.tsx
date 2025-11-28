import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useOrderTicketContext } from './orderTicketContext';
import { usePairTokensContext } from './pairTokensContext';

export type ChartSelectionMode =
  | 'none'
  | 'limit-price-from-chart'
  | 'scale-start-from-chart'
  | 'scale-end-from-chart';

interface ChartInteractionContextValue {
  selectionMode: ChartSelectionMode;
  setSelectionMode: (mode: ChartSelectionMode) => void;
  toggleSelectionMode: (mode: ChartSelectionMode) => void;
  handleChartPricePick: (price: number) => void;
  scaleStartPrice: string;
  setScaleStartPrice: (value: string) => void;
  scaleEndPrice: string;
  setScaleEndPrice: (value: string) => void;
}

const ChartInteractionContext = createContext<ChartInteractionContextValue | undefined>(undefined);

export const ChartInteractionProvider = ({ children }: { children: React.ReactNode }) => {
  const { setLimitPrice, setDirection, activeTab } = useOrderTicketContext();
  const { tokenPairData, assetId } = usePairTokensContext();

  const [selectionMode, setSelectionMode] = useState<ChartSelectionMode>('none');
  const [scaleStartPrice, setScaleStartPrice] = useState('');
  const [scaleEndPrice, setScaleEndPrice] = useState('');

  const currentMarketPrice = tokenPairData[assetId]?.assetCtx?.markPx;

  const priceDecimals = useMemo(() => {
    const meta = tokenPairData[assetId]?.universe;
    const decimalsCandidate =
      typeof meta?.pxDecimals === 'number'
        ? meta.pxDecimals
        : typeof meta?.szDecimals === 'number'
          ? meta.szDecimals
          : undefined;

    return Math.max(2, Number.isFinite(decimalsCandidate) ? Number(decimalsCandidate) : 2);
  }, [assetId, tokenPairData]);

  const formatPrice = useCallback(
    (price: number) => price.toFixed(priceDecimals),
    [priceDecimals]
  );

  const resetSelectionMode = useCallback(() => setSelectionMode('none'), []);

  const toggleSelectionMode = useCallback(
    (mode: ChartSelectionMode) => {
      setSelectionMode((prev) => (prev === mode ? 'none' : mode));
    },
    []
  );

  useEffect(() => {
    const isLimitMode = selectionMode === 'limit-price-from-chart';
    const isScaleMode =
      selectionMode === 'scale-start-from-chart' ||
      selectionMode === 'scale-end-from-chart';

    if ((isLimitMode && activeTab !== 'Limit') || (isScaleMode && activeTab !== 'Scale')) {
      resetSelectionMode();
    }
  }, [activeTab, resetSelectionMode, selectionMode]);

  const handleChartPricePick = useCallback(
    (price: number) => {
      if (typeof price !== 'number' || Number.isNaN(price) || selectionMode === 'none') return;

      const formattedPrice = formatPrice(price);

      if (selectionMode === 'limit-price-from-chart') {
        setLimitPrice(formattedPrice);

        if (typeof currentMarketPrice === 'number' && !Number.isNaN(currentMarketPrice)) {
          if (price > currentMarketPrice) {
            setDirection('sell');
          } else if (price < currentMarketPrice) {
            setDirection('buy');
          }
        }
      }

      if (selectionMode === 'scale-start-from-chart') {
        setScaleStartPrice(formattedPrice);
      }

      if (selectionMode === 'scale-end-from-chart') {
        setScaleEndPrice(formattedPrice);
      }

      resetSelectionMode();
    },
    [
      currentMarketPrice,
      formatPrice,
      resetSelectionMode,
      selectionMode,
      setDirection,
      setLimitPrice,
    ]
  );

  const value = useMemo(
    () => ({
      selectionMode,
      setSelectionMode,
      toggleSelectionMode,
      handleChartPricePick,
      scaleStartPrice,
      setScaleStartPrice,
      scaleEndPrice,
      setScaleEndPrice,
    }),
    [
      handleChartPricePick,
      scaleEndPrice,
      scaleStartPrice,
      selectionMode,
      toggleSelectionMode,
    ]
  );

  return (
    <ChartInteractionContext.Provider value={value}>
      {children}
    </ChartInteractionContext.Provider>
  );
};

export const useChartInteractionContext = () => {
  const ctx = useContext(ChartInteractionContext);
  if (!ctx) {
    throw new Error('useChartInteractionContext must be used within ChartInteractionProvider');
  }
  return ctx;
};
