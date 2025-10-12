// Tracks which Hyperliquid account the UI should act against (master vs sub).
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAddress } from '@thirdweb-dev/react';

// Define the context type
type SwitchAccountContextType = {
  currentAccount: {
    address: string;
    name: string;
  };
  switchAccountHandler: (address: string, name: string) => void;
};

// Create the context
const SwitchAccountContext = createContext({} as SwitchAccountContextType);

// Custom hook to access the context
export const useSwitchTradingAccount = () => {
  const context = useContext(SwitchAccountContext);
  if (!context) {
    throw new Error(
      'useSwitchTradingAccount must be used within a SwitchAccountProvider'
    );
  }
  return context;
};

// Create the context provider component
// Provider that stores the active trading account selection.
const SwitchAccountProvider = ({ children }: { children: React.ReactNode }) => {
  const userAddress = useAddress();

  //by default  set current account to master when adress from userAddress is available
  const [currentAccount, setCurrentAccount] = useState({
    address: userAddress ? userAddress : '',
    name: userAddress ? userAddress : '',
  });

  // Handler to switch the current account
  const switchAccountHandler = (address: string, name: string) => {
    setCurrentAccount({ address, name });
    console.log(`Switched to account: ${name}`, address);
  };

  useEffect(() => {
    // Default new sessions to the master account when a wallet connects.
    if (userAddress) {
      setCurrentAccount({ address: userAddress, name: 'Master' });
    }
  }, [userAddress]);

  return (
    <SwitchAccountContext.Provider
      value={{ currentAccount, switchAccountHandler }}
    >
      {/* Allow descendants to read the active account without prop drilling. */}
      {children}
    </SwitchAccountContext.Provider>
  );
};

export default SwitchAccountProvider;
