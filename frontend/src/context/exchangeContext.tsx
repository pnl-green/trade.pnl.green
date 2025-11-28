import React, { createContext, useContext, useMemo, useState } from 'react';

type ExchangeId = 'hyperliquid' | 'coinbase';

type ExchangeContextValue = {
  currentExchangeId: ExchangeId;
  setCurrentExchangeId: (id: ExchangeId) => void;
};

const ExchangeContext = createContext<ExchangeContextValue | undefined>(undefined);

export const ExchangeProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentExchangeId, setCurrentExchangeId] = useState<ExchangeId>('hyperliquid');

  const value = useMemo(
    () => ({ currentExchangeId, setCurrentExchangeId }),
    [currentExchangeId]
  );

  return <ExchangeContext.Provider value={value}>{children}</ExchangeContext.Provider>;
};

export const useExchange = () => {
  const ctx = useContext(ExchangeContext);
  if (!ctx) {
    throw new Error('useExchange must be used within an ExchangeProvider');
  }
  return ctx;
};
