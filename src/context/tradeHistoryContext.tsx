//
import React, { createContext, useContext, useEffect, useState } from 'react';
import { AllWebData2 } from '../../types/hyperliquid';
import { useAddress } from '@thirdweb-dev/react';

interface TradeHistoryProps {
  tradeHistoryData: AllWebData2 | any;
  loadingTradeHistoryData: boolean;
}

const TradeHistoryContext = createContext({} as TradeHistoryProps);

export const useTradeHistoryContext = () => {
  const context = useContext(TradeHistoryContext);
  if (!context) {
    throw new Error(
      'usePositionHistory must be used within a TradeHistoryProvider'
    );
  }
  return context;
};

const TradeHistoryProvider = ({ children }: any) => {
  const [tradeHistoryData, setTradeHistoryData] = useState<any>([]);
  const [loadingTradeHistoryData, setLoadingTradeHistoryData] =
    useState<boolean>(true);
  const userAddress = useAddress();

  useEffect(() => {
    if (userAddress) {
      // Create a new WebSocket connection
      const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WSS_URL}`);

      // When the WebSocket connection is open, send the subscribe message
      ws.onopen = () => {
        const message = JSON.stringify({
          method: 'subscribe',
          subscription: {
            type: 'userFills',
            user: userAddress,
          },
        });
        ws.send(message);
      };

      // Listen for messages from the WebSocket server
      ws.onmessage = (event) => {
        setLoadingTradeHistoryData(true);
        const message = JSON.parse(event.data);
        const data = message.data;

        if (message.channel === 'userFills') {
          if (data) {
            setTradeHistoryData(data);
            setLoadingTradeHistoryData(false);
          }
        } else if (message.channel === 'error') {
          setLoadingTradeHistoryData(false);
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
    } else {
      setLoadingTradeHistoryData(false);
      setTradeHistoryData([]);
    }
  }, [userAddress]);

  return (
    <TradeHistoryContext.Provider
      value={{
        tradeHistoryData,
        loadingTradeHistoryData,
      }}
    >
      {children}
    </TradeHistoryContext.Provider>
  );
};

export default TradeHistoryProvider;
