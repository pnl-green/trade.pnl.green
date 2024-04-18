import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAddress } from '@thirdweb-dev/react';
import { SubAccount } from '@/types/hyperliquid';
import { Hyperliquid } from '@/utils/hyperliquid';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

interface SubAccountsProps {
  subaccounts: SubAccount | any;
  relaodSubAccounts: boolean;
  setReloadSubAccounts: React.Dispatch<React.SetStateAction<boolean>>;
  hyperliquid: any;
  setHyperliquid: React.Dispatch<React.SetStateAction<any>>;
}

const SubAccountsContext = createContext({} as SubAccountsProps);

export const useSubAccountsContext = () => {
  const context = useContext(SubAccountsContext);
  if (!context) {
    throw new Error(
      'useOrderBookTrades must be used within a OrderBookTradesProvider'
    );
  }
  return context;
};

const SubAccountsProvider = ({ children }: any) => {
  //-------Hooks------
  const userAddress = useAddress();

  //------Local State------
  const [subaccounts, setSubAccounts] = useState<SubAccount[]>([]);
  const [relaodSubAccounts, setReloadSubAccounts] = useState(false);

  //------Hyperliquid------
  const [hyperliquid, setHyperliquid] = useState(
    new Hyperliquid(`${BASE_URL}`)
  );

  useEffect(() => {
    if (userAddress) {
      hyperliquid
        .subAccounts(userAddress)
        .then(({ data, success, error_type, msg }) => {
          success && data && setSubAccounts(data as SubAccount[]);

          if (!success) {
            // TODO: toast error message ???
            console.error({ error_type, msg });
          }
        });
    }
  }, [hyperliquid, relaodSubAccounts, userAddress]);

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
