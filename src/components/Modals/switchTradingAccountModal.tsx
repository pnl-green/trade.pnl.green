import React from 'react';
import { useSubAccountsContext } from '@/context/subAccountsContext';
import { SwitchTradingAccWrapper } from '@/styles/navbar.styles';
import { Box, ClickAwayListener } from '@mui/material';
import { useAddress, useDisconnect } from '@thirdweb-dev/react';

interface SwitchTradingAccountModalProps {
  onClose: () => void;
}

const SwitchTradingAccountModal: React.FC<SwitchTradingAccountModalProps> = ({
  onClose,
}) => {
  //------Third Web Hook------
  const userAddress = useAddress();
  const disconnect = useDisconnect();

  const { subaccounts } = useSubAccountsContext();

  //------JSX------
  return (
    <ClickAwayListener onClickAway={onClose}>
      <SwitchTradingAccWrapper>
        <Box className="tradingAccItems">
          <label>Master</label>
          <label>
            {userAddress?.slice(0, 6) + '...' + userAddress?.slice(-4)}
            <img src="/CopyIcon.png" />
          </label>
        </Box>
        <Box className="tradingAccItems">
          <label>Sub</label>
          <label>Trading Account</label>
        </Box>
        <Box onClick={disconnect}>
          <span>Disconnect</span>
        </Box>
      </SwitchTradingAccWrapper>
    </ClickAwayListener>
  );
};

export default SwitchTradingAccountModal;
