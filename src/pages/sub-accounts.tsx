import CreateSubAcc from "@/components/Modals/createSubAcc";
import RenameSubAccModal from "@/components/Modals/renameSubAcc";
import TransferFunds from "@/components/Modals/transferFunds";
import Layout from "@/components/layout";
import WalletConnectModal from "@/components/wallet-connect";
import { useSubAccountsContext } from "@/context/subAccountsContext";
import { GreenBtn } from "@/styles/common.styles";
import {
  Accounts,
  ActionBtn,
  LinearBgColors,
  StyledAccTable,
  SubAccWrapper,
  SubAccountsInnerBox,
} from "@/styles/subAccounts.styles";
import { Box } from "@mui/material";
import { useAddress } from "@thirdweb-dev/react";
import React, { ReactElement, useEffect, useState } from "react";

export interface AccountProps {
  name: string | any;
  address: string | any;
  equity: number | any;
}

const bgImages = [
  {
    image: "/Ellipse1.svg",
    styles: { top: "0", left: "0px", width: "928px", height: "928px" },
  },
  {
    image: "/Ellipse2.png",
    styles: {
      top: "-100px",
      left: "0px",
      width: "1000px",
      height: "1000px",
      opacity: 0.3,
    },
  },
  {
    image: "/Ellipse3.png",
    styles: { top: "0px", right: "0px", width: "400px", height: "400px" },
  },
  {
    image: "/Ellipse4.svg",
    styles: { bottom: "0px", right: "0px", width: "400px", height: "400px" },
  },
];

const SubAccounts = () => {
  const address = useAddress();
  const { subAccInfo } = useSubAccountsContext();

  console.log(subAccInfo);

  const [establishedConnection, setEstablishedConnection] = useState(false);
  const [isRenameSubAccModalOpen, setRenameSubAccModalOpen] = useState(false);
  const [renameAcc, setRenameAcc] = useState("");
  const [createSubAccModal, setcreateSubAccModal] = useState(false);
  const [createNewAcc, setCreateNewAcc] = useState("");
  const [isTransferModalOpen, setTransferModalOpen] = useState(false);
  const [amount, setAmount] = useState("");
  let [allAccountsData, setAllAccountsData] = useState<any>([]);

  allAccountsData = [
    {
      name: "Master Account",
      address: address,
      equity: "100",
    },
    ...subAccountsData,
  ];

  const [masterAccount, setMasterAccount] = useState<AccountProps>({
    name: "Master Account",
    address: address,
    equity: "100",
  });
  const [subAccount, setSubAccount] = useState<AccountProps>({
    name: "",
    address: "",
    equity: "",
  });

  const toggleRenameSubAccModal = () => {
    setRenameSubAccModalOpen((prev) => !prev);
  };

  const toggleCreateSubAccModal = () => {
    setcreateSubAccModal((prev) => !prev);
  };
  //toggleTransferModal
  const toggleTransferModal = (data: AccountProps) => {
    setTransferModalOpen((prev) => !prev);
    setSubAccount({
      name: data.name,
      address: data.address,
      equity: data.equity,
    });
  };

  const closeTransferModal = () => {
    if (isTransferModalOpen) {
      setAmount("");
      setTransferModalOpen(false);
    }
  };

  //establish connection
  function handleEstablishedConnection() {
    setEstablishedConnection(true);
  }

  //create a SubAcc
  function CreateSubAccount() {}

  // Copy address to clipboard
  function copyAddress(address: any, from?: string | "master" | "sub-acc") {
    if (address) {
      navigator.clipboard.writeText(address);
      if (from === "master") {
        console.log("copied to clipboard");
      } else if (from === "sub-acc") {
        console.log(
          "Warning: You are copying an address that is generated on the Pnl.Green. Do not send funds directly to this address, or your funds will be lost."
        );
      }
    } else {
      console.log("connect wallet");
    }
  }

  return (
    <>
      <SubAccWrapper>
        {bgImages.map((bg, index) => (
          <LinearBgColors key={index} bgimage={bg.image} styles={bg.styles} />
        ))}

        <SubAccountsInnerBox>
          <Box className="tabs">
            <h1>Sub-Accounts</h1>
            {!address ? (
              <WalletConnectModal />
            ) : (
              <>
                {!establishedConnection ? (
                  <GreenBtn onClick={handleEstablishedConnection}>
                    Establish Connection
                  </GreenBtn>
                ) : (
                  <GreenBtn onClick={toggleCreateSubAccModal}>
                    Create Sub-Account
                  </GreenBtn>
                )}
              </>
            )}
          </Box>

          <Accounts>
            <h2>Master Account</h2>
            <Box
              sx={{
                width: "100%",
                "@media (max-width: 730px)": {
                  overflowX: "auto",
                  overflowY: "hidden",
                  cursor: "move",
                  "&::-webkit-scrollbar": {
                    display: "none",
                  },
                },
              }}
            >
              <StyledAccTable>
                <thead>
                  <tr>
                    <td>Name</td>
                    <td>Address</td>
                    <td className="center-row" />
                    <td>Account Equity</td>
                    <td className="with-actionBtn paddingRight">Action</td>
                  </tr>
                </thead>

                <tbody>
                  <tr>
                    <td>{masterAccount.name}</td>
                    <td>
                      <span className="master_actions">
                        {address}
                        &nbsp;&nbsp;
                        <img
                          src="/CopyIcon.png"
                          onClick={() => copyAddress(address, "master")}
                        />
                      </span>
                    </td>
                    <td className="center-row"></td>
                    <td>{masterAccount.equity}</td>
                    <td className="with-actionBtn paddingRight">
                      {address ? (
                        <ActionBtn>Trade</ActionBtn>
                      ) : (
                        <WalletConnectModal
                          bgColor="transparent"
                          textColor="green"
                          btnTitle="connect"
                        />
                      )}
                    </td>
                  </tr>
                </tbody>
              </StyledAccTable>
            </Box>
          </Accounts>

          <Accounts sx={{ mt: "80px" }}>
            <h2>Sub-Accounts</h2>
            <Box
              sx={{
                width: "100%",
                "@media (max-width: 730px)": {
                  overflowX: "auto",
                  overflowY: "hidden",
                  cursor: "move",
                  "&::-webkit-scrollbar": {
                    display: "none",
                  },
                },
              }}
            >
              <StyledAccTable>
                <thead>
                  <tr>
                    <td>Name</td>
                    <td>Address</td>
                    <td className="center-row" />
                    <td>Account Equity</td>
                    <td className="with-actionBtn paddingRight">Action</td>
                  </tr>
                </thead>

                <tbody>
                  {subAccountsData.map((subAccounts, index) => (
                    <tr key={index}>
                      <td>
                        <span className="actions">
                          {subAccounts.name}&nbsp;&nbsp;
                          <img
                            src="/EditIcon.png"
                            onClick={toggleRenameSubAccModal}
                          />
                        </span>
                      </td>
                      <td>
                        <span className="actions">
                          {subAccounts.address?.slice(0, 4) +
                            "..." +
                            subAccounts.address?.slice(-4)}
                          &nbsp;&nbsp;
                          <img
                            src="/CopyIcon.png"
                            onClick={() =>
                              copyAddress(subAccounts.address, "sub-acc")
                            }
                          />
                        </span>
                      </td>
                      <td className="center-row" />
                      <td>{subAccounts.equity}</td>
                      <td className="with-actionBtn">
                        <span className="actions">
                          <ActionBtn
                            onClick={() => toggleTransferModal(subAccounts)}
                          >
                            Transfer
                          </ActionBtn>
                          <ActionBtn>Trade</ActionBtn>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </StyledAccTable>
            </Box>
          </Accounts>
        </SubAccountsInnerBox>
      </SubAccWrapper>

      {isRenameSubAccModalOpen && (
        <RenameSubAccModal
          onClose={() => setRenameSubAccModalOpen(false)}
          renameAcc={renameAcc}
          setRenameAcc={setRenameAcc}
          onConfirm={function (): void {
            throw new Error("Function not implemented.");
          }}
        />
      )}

      {createSubAccModal && (
        <CreateSubAcc
          onClose={() => setcreateSubAccModal(false)}
          createNewAcc={createNewAcc}
          setCreateNewAcc={setCreateNewAcc}
          onConfirm={function (): void {
            throw new Error("Function not implemented.");
          }}
        />
      )}

      {isTransferModalOpen && (
        <TransferFunds
          onClose={closeTransferModal}
          onConfirm={function (): void {
            throw new Error("Function not implemented.");
          }}
          amount={amount}
          setAmount={setAmount}
          masterAccount={masterAccount}
          subAccount={subAccount}
          allAccountsData={allAccountsData}
        />
      )}
    </>
  );
};

export default SubAccounts;

SubAccounts.getLayout = function getLayout(page: ReactElement) {
  return <Layout pageTitle="Pnl.Green | Sub-Accounts">{page}</Layout>;
};

const subAccountsData = [
  {
    id: 1,
    name: "Subway",
    address: "0xAbcdef1234567890Abcdef1234567890Abcdef12",
    equity: "1000",
  },
  {
    id: 2,
    name: "Acc 2",
    address: "0x1234567890Abcdef1234567890Abcdef12345678",
    equity: "2000",
  },
];
