import React, { createContext, useContext, useState } from 'react';

export type ExchangeId = 'coinbase' | 'kraken' | 'okx' | 'bitfinex' | 'gate';

interface ExchangeContextType {
  currentExchangeId: ExchangeId;
  setCurrentExchangeId: (exchange: ExchangeId) => void;
}

const ExchangeContext = createContext<ExchangeContextType | undefined>(undefined);

export const useExchangeContext = () => {
  const context = useContext(ExchangeContext);
  if (!context) {
    throw new Error('useExchangeContext must be used within an ExchangeProvider');
  }
  return context;
};

export const ExchangeProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentExchangeId, setCurrentExchangeId] = useState<ExchangeId>('coinbase');

  return (
    <ExchangeContext.Provider
      value={{
        currentExchangeId,
        setCurrentExchangeId,
      }}
    >
      {children}
    </ExchangeContext.Provider>
  );
};

export default ExchangeProvider;

