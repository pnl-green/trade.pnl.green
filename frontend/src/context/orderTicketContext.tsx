import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';

export type OrderDirection = 'buy' | 'sell';

type AutofillPayload = {
  limitPrice?: string;
  stopLoss?: string;
  takeProfits?: string[];
  direction?: OrderDirection;
  tpSlEnabled?: boolean;
  switchToLimit?: boolean;
};

interface OrderTicketContextValue {
  direction: OrderDirection;
  setDirection: (direction: OrderDirection) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  tpSlEnabled: boolean;
  setTpSlEnabled: (enabled: boolean) => void;
  limitPrice: string;
  setLimitPrice: (value: string) => void;
  stopLoss: string;
  setStopLoss: (value: string) => void;
  takeProfits: string[];
  setTakeProfits: (values: string[]) => void;
  applyAutofill: (payload: AutofillPayload) => void;
}

const OrderTicketContext = createContext<OrderTicketContextValue | undefined>(undefined);

export const OrderTicketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [direction, setDirection] = useState<OrderDirection>('buy');
  const [activeTab, setActiveTab] = useState('Market');
  const [tpSlEnabled, setTpSlEnabled] = useState(false);
  const [limitPrice, setLimitPrice] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfits, setTakeProfits] = useState<string[]>([]);

  const applyAutofill = useCallback(
    ({ limitPrice, stopLoss, takeProfits, direction, tpSlEnabled, switchToLimit }: AutofillPayload) => {
      if (typeof limitPrice === 'string') setLimitPrice(limitPrice);
      if (typeof stopLoss === 'string') setStopLoss(stopLoss);
      if (Array.isArray(takeProfits)) setTakeProfits(takeProfits);
      if (direction) setDirection(direction);
      if (typeof tpSlEnabled === 'boolean') setTpSlEnabled(tpSlEnabled);
      if (switchToLimit) setActiveTab('Limit');
    },
    []
  );

  const value = useMemo(
    () => ({
      direction,
      setDirection,
      activeTab,
      setActiveTab,
      tpSlEnabled,
      setTpSlEnabled,
      limitPrice,
      setLimitPrice,
      stopLoss,
      setStopLoss,
      takeProfits,
      setTakeProfits,
      applyAutofill,
    }),
    [direction, activeTab, tpSlEnabled, limitPrice, stopLoss, takeProfits, applyAutofill]
  );

  return <OrderTicketContext.Provider value={value}>{children}</OrderTicketContext.Provider>;
};

export const useOrderTicketContext = () => {
  const ctx = useContext(OrderTicketContext);
  if (!ctx) {
    throw new Error('useOrderTicketContext must be used within OrderTicketProvider');
  }
  return ctx;
};

