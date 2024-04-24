import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAddress, useChainId } from '@thirdweb-dev/react';
import { Chain, SubAccount } from '@/types/hyperliquid';
import { Hyperliquid } from '@/utils/hyperliquid';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000';

interface SubAccountsProps {
  subaccounts: SubAccount[];
  relaodSubAccounts: boolean;
  setReloadSubAccounts: React.Dispatch<React.SetStateAction<boolean>>;
  hyperliquid: Hyperliquid;
  setHyperliquid: React.Dispatch<React.SetStateAction<Hyperliquid>>;
}

const SubAccountsContext = createContext({} as SubAccountsProps);

export const useSubAccountsContext = () => {
  const context = useContext(SubAccountsContext);
  if (!context) {
    throw new Error('context must be used within a SubAccountsProvider');
  }
  return context;
};

const SubAccountsProvider = ({ children }: { children: React.ReactNode }) => {
  //-------Hooks------
  const userAddress = useAddress();
  const chainId = useChainId();

  //------Local State------
  const [subaccounts, setSubAccounts] = useState<SubAccount[]>([]);
  const [relaodSubAccounts, setReloadSubAccounts] = useState(false);

  //------Hyperliquid------
  const [hyperliquid, setHyperliquid] = useState(
    new Hyperliquid(`${BASE_URL}`)
  );

  useEffect(() => {
    if (userAddress) {
      hyperliquid.subAccounts(userAddress).then(({ data, success, msg }) => {
        success && data && setSubAccounts(data as SubAccount[]);

        if (!success) {
          // TODO: toast error message ???
          console.error({ msg });
        }
      });
    }
  }, [hyperliquid, relaodSubAccounts, userAddress]);

  useEffect(() => {
    let chain = chainId === 42161 ? Chain.Arbitrum : Chain.ArbitrumTestnet;

    setHyperliquid(new Hyperliquid(BASE_URL, chain));
  }, [chainId]);

  return (
    <SubAccountsContext.Provider
      value={{
        subaccounts,
        relaodSubAccounts,
        setReloadSubAccounts,
        hyperliquid,
        setHyperliquid,
      }}
    >
      {children}
    </SubAccountsContext.Provider>
  );
};

export default SubAccountsProvider;
