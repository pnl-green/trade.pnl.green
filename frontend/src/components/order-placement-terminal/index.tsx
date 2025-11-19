import { Box } from '@mui/material';
import React, { useState } from 'react';
import {
  RiskManagerWrapper,
} from '@/styles/riskManager.styles';
import MarketComponent from './market';
import LimitComponent from './limit';
import TwapOrderTerminal from './twap';
import ChaseOrderTerminal from './chase';
import ScaleOrderTerminal from './scale';
import RiskManagerModal from '../Modals/riskManagerModal';
import LeverageModal from '../Modals/leverageModal';
import MarginTypeModal from '../Modals/marginTypeModal';
import SegmentedControl from '../ui/SegmentedControl';

// Interface to define the shape of the modals state
interface optionsProps {
  [key: string]: any;
  riskManager: boolean;
  leverage: boolean;
  marginType: boolean;
}

// Array to hold the types and labels for various modal options
const options = [
  {
    type: 'riskManager',
    label: 'Risk Manager',
    tooltip:
      'Risk Manager helps you size trades based on your max loss, margin mode, and current portfolio risk.',
  },
  {
    type: 'leverage',
    label: 'Leverage',
    tooltip:
      'Leverage controls how large your position can be relative to your account equity. Higher leverage increases both potential profit and liquidation risk.',
  },
  {
    type: 'marginType',
    label: 'Margin Type',
    tooltip:
      'Margin Type lets you choose between cross and isolated margin, defining how much of your account can back this position.',
  },
];

const orderTabOptions = [
  {
    label: 'Market',
    value: 'Market',
    tooltip:
      'Market orders execute immediately at the best available prices in the orderbook, with potential slippage.',
  },
  {
    label: 'Limit',
    value: 'Limit',
    tooltip:
      'Limit orders let you specify a price. They only execute if the market trades at or through your limit price.',
  },
  {
    label: 'TWAP',
    value: 'TWAP',
    tooltip:
      'TWAP spreads your order over time to reduce market impact by executing smaller slices at intervals.',
  },
  {
    label: 'Chase',
    value: 'Chase',
    tooltip:
      'Chase orders automatically follow the best bid or ask within a defined range, helping you stay near the top of the book.',
  },
  {
    label: 'Scale',
    value: 'Scale',
    tooltip:
      'Scale orders place a ladder of multiple limit orders at different prices to build a position across a range.',
  },
];

const OrderPlacementTerminal = () => {
  const [activeTab, setActiveTab] = useState('Market'); // Track the active tab
  const [activeButton, setActiveButton] = useState<string | null>(null); // Track the active modal button
  // ------Modal Visibility states------
  const [modals, setModals] = useState<optionsProps>({
    riskManager: false,
    leverage: false,
    marginType: false,
  });

  //------Risk Manager States------
  const [portfolioValue, setPortfolioValue] = useState<string | number>('');
  const [AmountValue, setAmountValue] = useState<string | number>('');

  // Toggle the visibility of a modal and set the active button
  const toggleModal = (modalType: string) => {
    setModals({
      ...modals,
      [modalType]: !modals[modalType],
    });
    setActiveButton(modalType);
  };

  // Close a specific modal and reset the active button
  const closeModal = (modalType: string) => {
    setModals({
      ...modals,
      [modalType]: false,
    });
    setActiveButton(null);
  };

  // Set the active tab based on the clicked tab nam
  const handleTabChange = (tabName: string) => {
    setActiveTab(tabName);
  };

  return (
    <RiskManagerWrapper id="order-placement-terminal">
      <SegmentedControl
        ariaLabel="Risk controls"
        options={options.map(({ label, type, tooltip }) => ({
          label,
          value: type,
          tooltip,
        }))}
        value={activeButton || ''}
        onChange={(value) => toggleModal(value)}
      />

      {/* Render modals based on the modals state */}
      {modals.riskManager && (
        <RiskManagerModal
          onClose={() => closeModal('riskManager')}
          portfolioValue={portfolioValue}
          setPortfolioValue={setPortfolioValue}
          AmountValue={AmountValue}
          setAmountValue={setAmountValue}
        />
      )}
      {modals.leverage && (
        <LeverageModal
          onClose={() => {
            closeModal('leverage');
            setPortfolioValue('');
            setAmountValue('');
          }}
        />
      )}
      {modals.marginType && (
        <MarginTypeModal onClose={() => closeModal('marginType')} />
      )}

      <SegmentedControl
        ariaLabel="Order ticket mode"
        options={orderTabOptions}
        value={activeTab}
        onChange={handleTabChange}
      />

      {/* Conditionally render components based on active tab */}
      {activeTab === 'Market' && <MarketComponent />}
      {activeTab === 'Limit' && <LimitComponent />}
      {activeTab === 'TWAP' && <TwapOrderTerminal />}
      {activeTab === 'Chase' && <ChaseOrderTerminal />}
      {activeTab === 'Scale' && <ScaleOrderTerminal />}
    </RiskManagerWrapper>
  );
};

export default OrderPlacementTerminal;
