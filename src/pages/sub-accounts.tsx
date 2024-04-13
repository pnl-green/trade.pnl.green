import CreateSubAcc from '@/components/Modals/createSubAcc';
import RenameSubAccModal from '@/components/Modals/renameSubAcc';
import TransferFunds from '@/components/Modals/transferFunds';
import Layout from '@/components/layout';
import WalletConnectModal from '@/components/wallet-connect';
import { GreenBtn } from '@/styles/common.styles';
import {
  Accounts,
  ActionBtn,
  LinearBgColors,
  StyledAccTable,
  SubAccWrapper,
  SubAccountsInnerBox,
} from '@/styles/subAccounts.styles';
import { Box } from '@mui/material';
import { useAddress, useChainId } from '@thirdweb-dev/react';
import React, { ReactElement, useEffect, useState } from 'react';
import { Hyperliquid } from '../../utils';
import { Wallet, providers, utils } from 'ethers';
import { Chain, SubAccount } from '@/types/hyperliquid';

export interface AccountProps {
  name: string | any;
  address: string | any;
  equity: number | any;
}

const bgImages = [
  {
    image: '/Ellipse1.svg',
    styles: { top: '0', left: '0px', width: '928px', height: '928px' },
  },
  {
    image: '/Ellipse2.png',
    styles: {
      top: '-100px',
      left: '0px',
      width: '1000px',
      height: '1000px',
      opacity: 0.3,
    },
  },
  {
    image: '/Ellipse3.png',
    styles: { top: '0px', right: '0px', width: '400px', height: '400px' },
  },
  {
    image: '/Ellipse4.svg',
    styles: { bottom: '0px', right: '0px', width: '400px', height: '400px' },
  },
];

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000';

const SESSION_STORAGE_PREFIX = 'pnl.green';

const DEFAULT_AGENT = {
  privateKey: '',
  userAddress: '',
};

const SubAccounts = () => {
  // ------------------ Thirdweb Hooks ------------------
  const userAddress = useAddress();
  const chainId = useChainId();

  // ------------------ Local State ------------------
  const [establishedConnection, setEstablishedConnection] = useState(false);
  const [agent, setAgent] = useState(DEFAULT_AGENT);

  const [isRenameSubAccModalOpen, setRenameSubAccModalOpen] = useState(false);
  const [renameAcc, setRenameAcc] = useState('');
  const [relaodSubAccounts, setReloadSubAccounts] = useState(false);

  const [createSubAccModal, setcreateSubAccModal] = useState(false);
  const [createNewAcc, setCreateNewAcc] = useState('');

  const [isTransferModalOpen, setTransferModalOpen] = useState(false);
  const [amount, setAmount] = useState('');

  const [hyperliquid, setHyperliquid] = useState(new Hyperliquid(BASE_URL));

  const [masterAccount, setMasterAccount] = useState<AccountProps>({
    name: 'Master Account',
    address: userAddress,
    equity: '100',
  });

  const [subAccount, setSubAccount] = useState<AccountProps>({
    name: '',
    address: '',
    equity: '',
  });

  const [subaccounts, setSubAccounts] = useState<SubAccount[]>([]);

  const toggleRenameSubAccModal = () => {
    setRenameSubAccModalOpen((prev) => !prev);
  };

  const toggleCreateSubAccModal = () => {
    setcreateSubAccModal((prev) => !prev);
  };
  //toggleTransferModal
  const toggleTransferModal = (subaccount: SubAccount) => {
    setTransferModalOpen((prev) => !prev);
    setSubAccount({
      name: subaccount.name,
      address: subaccount.subAccountUser,
      equity: subaccount.clearinghouseState.withdrawable,
    });
  };

  const closeTransferModal = () => {
    if (isTransferModalOpen) {
      setAmount('');
      setTransferModalOpen(false);
    }
  };

  //establish connection
  const handleEstablishConnection = async () => {
    // hyperliquid.pending_agent
    sessionStorage.setItem(`${SESSION_STORAGE_PREFIX}.pending_agent`, '');

    // Create and connect agent
    let agent = Wallet.createRandom();

    let signer = new providers.Web3Provider(window.ethereum).getSigner();

    await hyperliquid.connect(signer, agent);

    // set agent to session storage
    let address = (userAddress || '').toLowerCase();

    sessionStorage.setItem(
      `${SESSION_STORAGE_PREFIX}.agent.${address}`,
      JSON.stringify({
        privateKey: agent.privateKey,
        userAddress: address,
      })
    );

    setAgent({
      privateKey: agent.privateKey,
      userAddress: address,
    });

    setEstablishedConnection(true);
  };

  //create a SubAcc
  const createSubAccountHandler = async () => {
    let signer = new Wallet(agent.privateKey);

    let { success, data, error_type, msg } = await hyperliquid.createSubAccount(
      signer,
      createNewAcc
    );

    if (success) {
      // TODO: toast success message
      console.log('Sub-account created successfully');
      setReloadSubAccounts((prev) => !prev);
    } else {
      // TODO: toast error message
    }

    console.log({ success, data, error_type, msg });
  };

  const handleSubAccountModify = async (subAccountUser: String) => {
    let signer = new Wallet(agent.privateKey);

    let { success, data, error_type, msg } = await hyperliquid.subAccountModify(
      signer,
      renameAcc,
      subAccountUser
    );

    if (success) {
      // TODO: toast success message
      console.log('Sub-account renamed successfully');

      // reload sub-accounts
      setReloadSubAccounts((prev) => !prev);
    } else {
      // TODO: toast error message
    }

    console.log({ success, data, error_type, msg });
  };

  // Copy address to clipboard
  function copyAddress(address: any, from?: string | 'master' | 'sub-acc') {
    if (address) {
      navigator.clipboard.writeText(address);
      if (from === 'master') {
        console.log('copied to clipboard');
      } else if (from === 'sub-acc') {
        console.log(
          'Warning: You are copying an address that is generated on the Pnl.Green. Do not send funds directly to this address, or your funds will be lost.'
        );
      }
    } else {
      console.log('connect wallet');
    }
  }

  useEffect(() => {
    // if unable to get agent from session storage, set establishedConnection to false
    let agent = sessionStorage.getItem(
      `pnl.green.agent.${(userAddress || '').toLowerCase()}`
    );

    // set agent to state if it exists
    if (agent) {
      setEstablishedConnection(true);
      setAgent(JSON.parse(agent));
    } else {
      setEstablishedConnection(false);
      setAgent(DEFAULT_AGENT);
    }
  }, [userAddress]);

  useEffect(() => {
    userAddress &&
      hyperliquid
        .subAccounts(userAddress)
        .then(({ data, success, error_type, msg }) => {
          success && data && setSubAccounts(data as SubAccount[]);

          if (!success) {
            // TODO: toast error message ???
            console.error({ error_type, msg });
          }
        });
  }, [hyperliquid, relaodSubAccounts, userAddress]);

  useEffect(() => {
    let chain = chainId === 42161 ? Chain.Arbitrum : Chain.ArbitrumTestnet;

    setHyperliquid(new Hyperliquid(BASE_URL, chain));
  }, [chainId]);

  return (
    <>
      <SubAccWrapper>
        {bgImages.map((bg, index) => (
          <LinearBgColors key={index} bgimage={bg.image} styles={bg.styles} />
        ))}

        <SubAccountsInnerBox>
          <Box className="tabs">
            <h1>Sub-Accounts</h1>
            {!userAddress ? (
              <WalletConnectModal />
            ) : (
              <>
                {!establishedConnection ? (
                  <GreenBtn onClick={handleEstablishConnection}>
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
                width: '100%',
                '@media (max-width: 730px)': {
                  overflowX: 'auto',
                  overflowY: 'hidden',
                  cursor: 'move',
                  '&::-webkit-scrollbar': {
                    display: 'none',
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
                        {userAddress}
                        &nbsp;&nbsp;
                        <img
                          src="/CopyIcon.png"
                          onClick={() => copyAddress(userAddress, 'master')}
                        />
                      </span>
                    </td>
                    <td className="center-row"></td>
                    <td>{masterAccount.equity}</td>
                    <td className="with-actionBtn paddingRight">
                      {userAddress ? (
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

          <Accounts sx={{ mt: '80px' }}>
            <h2>Sub-Accounts</h2>
            <Box
              sx={{
                width: '100%',
                '@media (max-width: 730px)': {
                  overflowX: 'auto',
                  overflowY: 'hidden',
                  cursor: 'move',
                  '&::-webkit-scrollbar': {
                    display: 'none',
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
                  {subaccounts
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((subAccount, index) => (
                      <tr key={index}>
                        <td>
                          <span className="actions">
                            {subAccount.name}&nbsp;&nbsp;
                            <img
                              src="/EditIcon.png"
                              onClick={toggleRenameSubAccModal}
                            />
                          </span>
                        </td>
                        <td>
                          <span className="actions">
                            {subAccount.subAccountUser?.slice(0, 4) +
                              '...' +
                              subAccount.subAccountUser?.slice(-4)}
                            &nbsp;&nbsp;
                            <img
                              src="/CopyIcon.png"
                              onClick={() =>
                                copyAddress(
                                  subAccount.subAccountUser,
                                  'sub-acc'
                                )
                              }
                            />
                          </span>
                        </td>
                        <td className="center-row" />
                        <td>{subAccount.clearinghouseState.withdrawable}</td>
                        <td className="with-actionBtn">
                          <span className="actions">
                            <ActionBtn
                              onClick={() => toggleTransferModal(subAccount)}
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
          onConfirm={() =>
            // TODO make subAccountUser dynamic
            handleSubAccountModify('0x37dcf254c08c68e85e0b5f97fe99aa991133d941')
          }
        />
      )}

      {createSubAccModal && (
        <CreateSubAcc
          onClose={() => setcreateSubAccModal(false)}
          createNewAcc={createNewAcc}
          setCreateNewAcc={setCreateNewAcc}
          onConfirm={createSubAccountHandler}
        />
      )}

      {isTransferModalOpen && (
        <TransferFunds
          onClose={closeTransferModal}
          onConfirm={function (): void {
            throw new Error('Function not implemented.');
          }}
          amount={amount}
          setAmount={setAmount}
          masterAccount={masterAccount}
          subAccount={subAccount}
        />
      )}
    </>
  );
};

export default SubAccounts;

SubAccounts.getLayout = function getLayout(page: ReactElement) {
  return <Layout pageTitle="Pnl.Green | Sub-Accounts">{page}</Layout>;
};
