//
import React, { createContext, useContext, useEffect, useState } from 'react';
import { AllWebData2 } from '../../types/hyperliquid';
import { useAddress } from '@thirdweb-dev/react';

const WSS_URL =
  process.env.NEXT_PUBLIC_WSS_URL || 'wss://api.hyperliquid-testnet.xyz/ws';
interface OrderHistoryProps {
  twapHistoryData: AllWebData2 | any;
  loadingTwapData: boolean;
}

const TwapHistoryContext = createContext({} as OrderHistoryProps);

export const useTwapHistoryContext = () => {
  const context = useContext(TwapHistoryContext);
  if (!context) {
    throw new Error('context must be used within a TwapHistoryProvider');
  }
  return context;
};

const TwapHistoryProvider = ({ children }: { children: React.ReactNode }) => {
  const [twapHistoryData, setTwapHistoryData] = useState<any>([]);
  const [loadingTwapData, setLoadingTwapData] = useState<boolean>(true);
  const userAddress = useAddress();

  useEffect(() => {
    if (userAddress) {
      // Create a new WebSocket connection
      const ws = new WebSocket(`${WSS_URL}`);

      // When the WebSocket connection is open, send the subscribe message
      ws.onopen = () => {
        const message = JSON.stringify({
          method: 'subscribe',
          subscription: {
            type: 'userTwapHistory',
            user: userAddress,
          },
        });
        ws.send(message);
      };

      // Listen for messages from the WebSocket server
      ws.onmessage = (event) => {
        setLoadingTwapData(true);
        const message = JSON.parse(event.data);
        const data = message.data;

        if (message.channel === 'userTwapHistory') {
          if (data) {
            setTwapHistoryData(data);
            setLoadingTwapData(false);
          }
        } else if (message.channel === 'error') {
          setLoadingTwapData(false);
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
      setLoadingTwapData(false);
      setTwapHistoryData([]);
    }
  }, [userAddress]);

  return (
    <TwapHistoryContext.Provider
      value={{
        twapHistoryData,
        loadingTwapData,
      }}
    >
      {children}
    </TwapHistoryContext.Provider>
  );
};

export default TwapHistoryProvider;
