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
import EstablishConnectionModal from '../Modals/establishConnectionModal';
import { useHyperLiquidContext } from '@/context/hyperLiquidContext';
import Tooltip from '../ui/Tooltip';
import { orderTicketTooltips } from './tooltipCopy';
import { useOrderTicketContext } from '@/context/orderTicketContext';
import DirectionSelector from './DirectionSelector';
import { derivePairSymbols, getCurrentPositionSize } from '@/utils';

const ScaleOrderTerminal = () => {
  const { webData2 } = useWebDataContext();
  const { tokenPairs, pair } = usePairTokensContext();
  const { establishedConnection, handleEstablishConnection } =
    useHyperLiquidContext();
  const { direction, setDirection } = useOrderTicketContext();
  const { base, quote } = derivePairSymbols(tokenPairs, pair);
  const currentPositionSize = getCurrentPositionSize(webData2, base);

  const [isLoading, setIsLoading] = useState(false);
  const [radioValue, setRadioValue] = useState('');
  const [selectOrderType, setSelectOrderType] = useState('GTC');
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectItem, setSelectItem] = useState(base || `${tokenPairs[0]}`);
  const [size, setSize] = useState('');
  const [allowedBeforeMarketPurchase, setAllowedBeforeMarketPurchase] =
    useState('');

  const [establishConnModal, setEstablishedConnModal] = useState(false);

  //Take Profit / Stop Loss
  const [takeProfitPrice, setTakeProfitPrice] = useState('');
  const [stopLossPrice, setStopLossPrice] = useState('');
  const [gain, setGain] = useState('');
  const [loss, setLoss] = useState('');

  const [startPrice, setStartPrice] = useState('');
  const [endPrice, setEndPrice] = useState('');
  const [totalNoOfOrders, setTotalNoOfOrders] = useState('');
  const [sizeSkew, setSizeSkew] = useState('');

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
    setSelectItem(base || `${tokenPairs[0]}`);
  }, [base, tokenPairs]);
  return (
    <Box
      sx={{
        position: 'relative',
        height: radioValue === '2' ? 'calc(100% + 85px)' : '100%',
      }}
    >
      <DirectionSelector />
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
          <span>
            {currentPositionSize.toFixed(4)} {base || quote || '—'}
          </span>
        </FlexItems>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <SelectItemsBox>
          <RenderInput
            label="Size"
            tooltip={orderTicketTooltips.size}
            placeholder="|"
            type="number"
            value={size}
            onChange={(e: any) => setSize(e.target.value)}
            styles={{
              background: 'transparent',
              '.placeholder_box': {
                fontSize: '12px',
              },
              ':hover': {
                border: 'none !important',
              },
            }}
          />
          <HandleSelectItems
            selectItem={selectItem}
            setSelectItem={setSelectItem}
            selectDataItems={[base || tokenPairs[0] || '—', quote || 'USDC', 'R']}
          />
        </SelectItemsBox>
        <FlexItems>
          <RenderInput
            label="Start Price"
            placeholder="0"
            type="number"
            value={startPrice}
            onChange={(e: any) => setStartPrice(e.target.value)}
            styles={{
              gap: 0,
              width: '52%',
              '.placeholder_box': {
                fontSize: '12px',
              },
              input: { width: '30%', padding: '0' },
            }}
          />

          <RenderInput
            label="End price"
            placeholder="0"
            type="number"
            value={endPrice}
            onChange={(e: any) => setEndPrice(e.target.value)}
            styles={{
              gap: 0,
              width: '45%',
              '.placeholder_box': {
                fontSize: '12px',
              },
              input: { width: '30%', padding: '0' },
            }}
          />
        </FlexItems>

        <FlexItems>
          <RenderInput
            label="Total no.of Orders"
            placeholder="0"
            type="number"
            value={totalNoOfOrders}
            onChange={(e: any) => setTotalNoOfOrders(e.target.value)}
            styles={{
              gap: 0,
              width: '55%',
              '.placeholder_box': {
                width: '90% !important',
                fontSize: '12px',
              },
              input: { width: '20%', padding: '0' },
            }}
          />

          <RenderInput
            label="Size skew"
            placeholder="0"
            type="number"
            value={sizeSkew}
            onChange={(e: any) => setSizeSkew(e.target.value)}
            styles={{
              gap: 0,
              width: '40%',
              '.placeholder_box': {
                fontSize: '12px',
              },
              input: { width: '30%', padding: '0' },
            }}
          />
        </FlexItems>
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
              type="number"
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
              type="number"
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

      {establishedConnection ? (
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
      ) : (
        <Box sx={{ ...ButtonStyles }}>
          <Tooltip content={orderTicketTooltips.enableTrading}>
            <BuySellBtn
              className="buyBtn"
              sx={{ width: '100%' }}
              onClick={() => setEstablishedConnModal(true)}
            >
              Enable trading
            </BuySellBtn>
          </Tooltip>
        </Box>
      )}

      {confirmModalOpen && (
        <ConfirmationModal
          onClose={() => setConfirmModalOpen(false)}
          onConfirm={function (): void {
            throw new Error('Function not implemented.');
          }}
          isScale={true}
          size={`${size} ${selectItem}`}
          isTpSl={radioValue === '2' ? true : false}
          takeProfitPrice={radioValue === '2' ? takeProfitPrice : undefined}
          stopLossPrice={radioValue === '2' ? stopLossPrice : undefined}
          estLiqPrice={estLiqPrice}
          noOfOrders={totalNoOfOrders}
          skew={sizeSkew}
          fee={fee}
          isBuyOrSell={direction}
          loading={isLoading}
          setLoading={setIsLoading}
        />
      )}

      {establishConnModal && (
        <EstablishConnectionModal
          onClose={() => setEstablishedConnModal(false)}
          onEstablishConnection={() =>
            handleEstablishConnection({
              setIsLoading: setIsLoading,
              setEstablishedConnModal: setEstablishedConnModal,
            })
          }
          isLoading={isLoading}
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

export default ScaleOrderTerminal;
