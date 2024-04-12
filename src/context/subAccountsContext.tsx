import React, { createContext, useContext, useEffect, useState } from "react";
import { useAddress } from "@thirdweb-dev/react";

const POST_BASE_URL = process.env.NEXT_PUBLIC_POST_BASE_URL;

interface SubAccountsProps {
  subAccInfo: { success: boolean; data: {}[] };
}

const SubAccountsContext = createContext({} as SubAccountsProps);

export const useSubAccountsContext = () => {
  const context = useContext(SubAccountsContext);
  if (!context) {
    throw new Error(
      "useOrderBookTrades must be used within a OrderBookTradesProvider"
    );
  }
  return context;
};

const SUbAccountsProvider = ({ children }: any) => {
  const address = useAddress();
  const [subAccInfo, setSubAccInfo] = useState({ success: false, data: [] });

  const getSubAccInfo = async () => {
    try {
      const res = await fetch(`${POST_BASE_URL}/info`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          exchange: "hyperliquid",
          type: "subAccounts",
          user: address,
        }),
      });
      const data = await res.json();
      setSubAccInfo(data);
      // return data;
    } catch (error) {
      console.log(error);
      // return error;
    }
  };

  // useEffect(() => {
  //   getSubAccInfo();
  // }, []);

  return (
    <SubAccountsContext.Provider value={{ subAccInfo }}>
      {children}
    </SubAccountsContext.Provider>
  );
};

export default SUbAccountsProvider;
