import { SelectItemsBox } from '@/styles/riskManager.styles';
import { Box } from '@mui/material';
import React, { useEffect, useState } from 'react';
import HandleSelectItems from '../handleSelectItems';
import { ButtonStyles, BuySellBtn, FlexItems } from '@/styles/common.styles';
import { RenderInput } from './commonInput';
import { usePairTokensContext } from '@/context/pairTokensContext';
import ConfirmationModal from '../Modals/confirmationModals';
import LiquidationContent from './liquidationContent';
import { useWebDataContext } from '@/context/webDataContext';
import Tooltip from '../ui/Tooltip';
import { orderTicketTooltips } from './tooltipCopy';
import { useOrderTicketContext } from '@/context/orderTicketContext';

const ChaseOrderTerminal = () => {
  const { tokenPairs } = usePairTokensContext();
  const { webData2 } = useWebDataContext();
  const { direction, setDirection } = useOrderTicketContext();

  const [radioValue, setRadioValue] = useState('');
  const [selectOrderType, setSelectOrderType] = useState('GTC');
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectItem, setSelectItem] = useState(`${tokenPairs[0]}`);
  const [size, setSize] = useState('');
  const [allowedBeforeMarketPurchase, setAllowedBeforeMarketPurchase] =
    useState('');

  //Take Profit / Stop Loss
  const [takeProfitPrice, setTakeProfitPrice] = useState('');
  const [stopLossPrice, setStopLossPrice] = useState('');
  const [gain, setGain] = useState('');
  const [loss, setLoss] = useState('');

  const [estLiqPrice, setEstLiquidationPrice] = useState('100');
  const [fee, setFee] = useState('100');

  const toggleConfirmModal = (button: string) => {
    setConfirmModalOpen(true);
    setDirection(button as 'buy' | 'sell');
  };

  const handleRadioChange = (e: {
    target: { value: React.SetStateAction<string> };
  }) => {
    setRadioValue(e.target.value);
  };

  const handleRadioClick = (e: any) => {
    if (radioValue === e.target.value) {
      setRadioValue('');
    }
  };

  useEffect(() => {
    setSelectItem(`${tokenPairs[0]}`);
  }, [tokenPairs]);

  return (
    <Box
      sx={{
        position: 'relative',
        height: radioValue === '2' ? 'calc(100% + 85px)' : '100%',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: '5px',
          mt: '20px',
        }}
      >
        <FlexItems>
          <Tooltip content={orderTicketTooltips.availableBalance}>
            <span>Available balance</span>
          </Tooltip>
          <span>
            {Number(webData2.clearinghouseState?.withdrawable).toFixed(2)}
          </span>
        </FlexItems>
        <FlexItems>
          <Tooltip content={orderTicketTooltips.currentPositionSize}>
            <span>Current position size</span>
          </Tooltip>
          <span>0.0 APE</span>
        </FlexItems>
      </Box>

      <RenderInput
        label="Allowed Before Market Purchase"
        placeholder="5%"
        type="number"
        value={allowedBeforeMarketPurchase}
        onChange={(e: any) => setAllowedBeforeMarketPurchase(e.target.value)}
        styles={{
          marginTop: '10px',
          '.placeholder_box': {
            fontSize: '12px !important',
            width: 'fit-content !important',
          },
          input: {
            width: '20% !important',
          },
        }}
      />

      <SelectItemsBox>
        <RenderInput
          label={'Size'}
          tooltip={orderTicketTooltips.size}
          placeholder="|"
          type="number"
          value={size}
          onChange={(e: any) => setSize(e.target.value)}
          styles={{
            background: 'transparent',
            ':hover': {
              border: 'none !important',
            },
          }}
        />
        <HandleSelectItems
          selectItem={selectItem}
          setSelectItem={setSelectItem}
          selectDataItems={[`${tokenPairs[0]}`, `${tokenPairs[1]}`]}
        />
      </SelectItemsBox>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          mt: '20px',
          gap: '8px',
          label: {
            marginRight: '8px',
            cursor: 'pointer',
          },
        }}
      >
        <FlexItems
          sx={{
            justifyContent: 'flex-start',
          }}
        >
          <label>
            <input
              type="radio"
              name="radio"
              value="1"
              checked={radioValue === '1'}
              onChange={handleRadioChange}
              onClick={handleRadioClick}
            />
          </label>
          <Tooltip content={orderTicketTooltips.reduceOnly}>
            <span>Reduce Only</span>
          </Tooltip>
        </FlexItems>

        <FlexItems sx={{ justifyContent: 'flex-start' }}>
          <label>
            <input
              type="radio"
              name="radio"
              value="2"
              checked={radioValue === '2'}
              onChange={handleRadioChange}
              onClick={handleRadioClick}
            />
          </label>
          <Tooltip content={orderTicketTooltips.takeProfitStopLoss}>
            <span>Take Profit / Stop Loss</span>
          </Tooltip>
        </FlexItems>
      </Box>

      {radioValue === '2' && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            mt: '10px',
            height: '70px',
            gap: '2px',
          }}
        >
          <FlexItems>
            <RenderInput
              label="TP Price"
              placeholder="0"
              type="number"
              value={takeProfitPrice}
              onChange={(e: any) => setTakeProfitPrice(e.target.value)}
              styles={{
                gap: 0,
                width: '49%',
                '.placeholder_box': {
                  fontSize: '12px',
                },
                input: { width: '30%', padding: '0' },
              }}
            />

            <RenderInput
              label="Gain"
              placeholder="$"
              styles={{
                gap: 0,
                width: '49%',
                '.placeholder_box': {
                  fontSize: '12px',
                },
                input: { width: '30%', padding: '0' },
              }}
            />
          </FlexItems>

          <FlexItems>
            <RenderInput
              label="SL Price"
              placeholder="0"
              type="number"
              value={stopLossPrice}
              onChange={(e: any) => setStopLossPrice(e.target.value)}
              styles={{
                gap: 0,
                width: '49%',
                '.placeholder_box': {
                  width: '90% !important',
                  fontSize: '12px',
                },
                input: { width: '20%', padding: '0' },
              }}
            />

            <RenderInput
              label="Loss"
              placeholder="$"
              styles={{
                gap: 0,
                width: '49%',
                '.placeholder_box': {
                  fontSize: '12px',
                },
                input: { width: '30%', padding: '0' },
              }}
            />
          </FlexItems>
        </Box>
      )}

      <SelectItemsBox
        sx={{
          '&:hover': {
            border: 'none !important',
          },
        }}
      >
        <span>Order Type</span>
        <HandleSelectItems
          selectItem={selectOrderType}
          setSelectItem={setSelectOrderType}
          selectDataItems={['GTC', 'IOC', 'ALO']}
        />
      </SelectItemsBox>

      <Box sx={{ ...ButtonStyles }}>
        <BuySellBtn
          sx={{ width: '112px' }}
          className="buyBtn"
          onClick={() => toggleConfirmModal('buy')}
        >
          Buy
        </BuySellBtn>
        <BuySellBtn
          sx={{ width: '112px' }}
          className="sellBtn"
          onClick={() => toggleConfirmModal('sell')}
        >
          Sell
        </BuySellBtn>
      </Box>

      {confirmModalOpen && (
        <ConfirmationModal
          onClose={() => setConfirmModalOpen(false)}
          onConfirm={function (): void {
            throw new Error('Function not implemented.');
          }}
          isChase={true}
          size={`${size} ${selectItem}`}
          allowanceBeforeMarketPurchase={allowedBeforeMarketPurchase}
          isTpSl={radioValue === '2' ? true : false}
          takeProfitPrice={radioValue === '2' ? takeProfitPrice : undefined}
          stopLossPrice={radioValue === '2' ? stopLossPrice : undefined}
          estLiqPrice={estLiqPrice}
          fee={fee}
          isBuyOrSell={direction}
        />
      )}

      <LiquidationContent
      //TODO: Add props

      // liquidationPrice={}
      // orderValue={}
      // marginRequired={}
      // fees={}
      />
    </Box>
  );
};

export default ChaseOrderTerminal;
