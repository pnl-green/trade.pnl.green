import { SettingsModalWrapper, StyledCheckBox } from '@/styles/navbar.styles';
import { Box, ClickAwayListener } from '@mui/material';
import React, { useState } from 'react';
import { LAYOUT_STORAGE_KEY } from '../layout/TerminalLayout';

interface settingsProps {
  onClose: () => void;
}

type SettingsState = {
  [key: string]: boolean;
};

const settingsOptions = [
  { id: 'skipOrderOpen', label: 'Skip Order Open Confirmation' },
  { id: 'skipOrderClose', label: 'Skip Order Close Confirmation' },
  { id: 'persistentConnection', label: 'Persistent Trading Connection' },
  { id: 'customizeLayout', label: 'Customize Layout' },
  { id: 'orderbookSetSize', label: 'Orderbook Set Size on Click' },
  { id: 'displayVerboseErrors', label: 'Display Verbose Errors' },
  { id: 'displayNotification', label: 'Display Notification' },
  { id: 'showWarnings', label: 'Show Warnings' },
];
const SettingsModal: React.FC<settingsProps> = ({ onClose }) => {
  const [settings, setSettings] = useState<SettingsState>({
    skipOrderOpen: false,
    skipOrderClose: false,
    persistentConnection: false,
    customizeLayout: false,
    orderbookSetSize: false,
    displayVerboseErrors: false,
    displayNotification: false,
    showWarnings: false,
  });

  const handleSettingChange =
    (settingId: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setSettings((prevSettings) => ({
        ...prevSettings,
        [settingId]: event.target.checked,
      }));
    };

  const resetToDefault = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LAYOUT_STORAGE_KEY);
      window.dispatchEvent(new CustomEvent('pnl-reset-layout'));
    }

    setSettings({
      skipOrderOpen: false,
      skipOrderClose: false,
      persistentConnection: false,
      customizeLayout: false,
      orderbookSetSize: false,
      displayVerboseErrors: false,
      displayNotification: false,
      showWarnings: false,
    });
    onClose();
  };

  const SettingItem: React.FC<{
    label: string;
    checked: boolean;
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  }> = ({ label, checked, onChange }) => (
    <Box className="settingItems">
      <label>{label}</label>
      <StyledCheckBox>
        <input type="checkbox" checked={checked} onChange={onChange} />
      </StyledCheckBox>
    </Box>
  );

  return (
    <ClickAwayListener onClickAway={onClose}>
      <SettingsModalWrapper>
        <Box className="innerBox">
          {settingsOptions.map((option) => (
            <SettingItem
              key={option.id}
              label={option.label}
              checked={settings[option.id]}
              onChange={handleSettingChange(option.id)}
            />
          ))}
          <Box sx={{ padding: '6px 0', cursor: 'pointer' }} onClick={resetToDefault}>
            <label>
              <span>Reset trading layout</span>
            </label>
          </Box>
        </Box>
      </SettingsModalWrapper>
    </ClickAwayListener>
  );
};

export default SettingsModal;
