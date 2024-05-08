import {
  LiquidationWrapper,
  SelectItemsBox,
} from '@/styles/riskManager.styles';
import { Box } from '@mui/material';
import React, { useEffect, useState } from 'react';
import HandleSelectItems from '../handleSelectItems';
import { ButtonStyles, BuySellBtn, FlexItems } from '@/styles/common.styles';
import { RenderInput } from './commonInput';
import { usePairTokensContext } from '@/context/pairTokensContext';
import ConfirmationModal from '../Modals/confirmationModals';
import { OrderType } from '@/types/hyperliquid';
import { useSubAccountsContext } from '@/context/subAccountsContext';

const MarketComponent = () => {
  const { tokenPairs, tokenPairData, assetId } = usePairTokensContext();

  const [radioValue, setRadioValue] = useState<string | any>('');
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [isBuyOrSell, setIsBuyOrSell] = useState(''); //buy | sell

  const [selectItem, setSelectItem] = useState(`${tokenPairs[0]}`);
  const currentMarketPrice = tokenPairData[assetId]?.assetCtx.markPx;
  const [size, setSize] = useState<number | any>('');
  const [takeProfitPrice, setTakeProfitPrice] = useState<number | any>('');
  const [stopLossPrice, setStopLossPrice] = useState<number | any>('');
  const [gain, setGain] = useState<number | any>('');
  const [loss, setLoss] = useState<number | any>('');

  const { hyperliquid, setHyperliquid } = useSubAccountsContext();

  const toggleConfirmModal = (button: string) => {
    setConfirmModalOpen(true);
    setIsBuyOrSell(button);
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


  //
  const handlePlaceOrder = async () => {
    try {
      let isBuy = isBuyOrSell === 'buy';
      let orderType: OrderType = {
        limit: {
          tif: 'FrontendMarket',
        },
      };
      let reduceOnly = radioValue === '1';

      // Calculate limit price based on buy or sell
      let limitPx = isBuy
        ? Number(currentMarketPrice) * 1.03
        : Number(currentMarketPrice) * 0.97;

      console.log('LimitPx', limitPx, 0, isBuy, size, orderType, reduceOnly);
      console.log(tokenPairData[assetId].assetCtx.markPx);

      const { success, data, msg } = await hyperliquid.placeOrder(
        Number(assetId),
        isBuy,
        String(limitPx),
        size,
        orderType,
        reduceOnly
      );

      if (success) {
        console.log('data', data);
        //Toast success 
      } else {
        console.log('msg', msg);
        //Toast error
      }
    } catch (error) {
      console.log('error', error);
    }
  };

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
          <span>Available balance</span>
          <span>10:00</span>
        </FlexItems>
        <FlexItems>
          <span>Current position size</span>
          <span>0.0 APE</span>
        </FlexItems>
      </Box>

      <Box
        sx={{ display: 'flex', flexDirection: 'column', gap: '6px', mt: '6px' }}
      >
        <SelectItemsBox sx={{ '&:hover': { border: 'none' }, m: 0 }}>
          <span>Current Market Price</span>
          <span>${currentMarketPrice}</span>
        </SelectItemsBox>

        <SelectItemsBox sx={{ m: 0 }}>
          <RenderInput
            label={'Size'}
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

        <SelectItemsBox sx={{ '&:hover': { border: 'none' }, m: 0 }}>
          <span> Price</span>
          <span>$1000</span>
        </SelectItemsBox>
      </Box>

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
          <span>Reduce Only</span>
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
          <span>Take Profit / Stop Loss</span>
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
              value={gain}
              onChange={(e: any) => setGain(e.target.value)}
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
              value={loss}
              onChange={(e: any) => setLoss(e.target.value)}
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
          onConfirm={handlePlaceOrder}
          isMarket={true}
          currentMarketPrice={currentMarketPrice}
          size={`${size} ${selectItem}`}
          isTpSl={radioValue === '2' ? true : false}
          takeProfitPrice={radioValue === '2' ? takeProfitPrice : undefined}
          stopLossPrice={radioValue === '2' ? stopLossPrice : undefined}
          estLiqPrice={1}
          fee={1}
          isBuyOrSell={isBuyOrSell}
        />
      )}

      <LiquidationWrapper sx={{ position: 'absolute', bottom: 0 }}>
        <Box className="items">
          <span>Liquidation Price</span>
          <span>N/A</span>
        </Box>
        <Box className="items">
          <span>Order Value</span>
          <span>N/A</span>
        </Box>
        <Box className="items">
          <span>Margin Required</span>
          <span>N/A</span>
        </Box>
        <Box className="items">
          <span>Fees</span>
          <span>N/A</span>
        </Box>
      </LiquidationWrapper>
    </Box>
  );
};

export default MarketComponent;
