//
import React, { createContext, useContext, useEffect, useState } from 'react';
import { AllWebData2 } from '../../types/hyperliquid';
import { useAddress } from '@thirdweb-dev/react';

interface PositionHistoryProps {
  webData2: AllWebData2 | any;
  loadingWebData2: boolean;
}

const PositionHistoryContext = createContext({} as PositionHistoryProps);

export const usePositionHistoryContext = () => {
  const context = useContext(PositionHistoryContext);
  if (!context) {
    throw new Error(
      'usePositionHistory must be used within a PositionHistoryProvider'
    );
  }
  return context;
};

const PositionHistoryProvider = ({ children }: any) => {
  const [webData2, setWebData2] = useState<any>([]);
  const [loadingWebData2, setLoadingWebData2] = useState<boolean>(true);
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
            type: 'webData2',
            user: userAddress,
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
            setWebData2(data);
            setLoadingWebData2(false);
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
    } else {
      setLoadingWebData2(false);
      setWebData2([]);
    }
  }, [userAddress]);

  return (
    <PositionHistoryContext.Provider
      value={{
        webData2,
        loadingWebData2,
      }}
    >
      {children}
    </PositionHistoryContext.Provider>
  );
};

export default PositionHistoryProvider;
