import { SelectItemsBox } from '@/styles/riskManager.styles';
import { Box, Slider, styled } from '@mui/material';
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
import DirectionSelector from './DirectionSelector';
import { derivePairSymbols, getCurrentPositionSize } from '@/utils';
import { intelayerColors, intelayerFonts } from '@/styles/theme';
import SelectionInput from './SelectionInput';

const SectionLabel = styled('div')(() => ({
  fontSize: '12px',
  color: intelayerColors.subtle,
  fontFamily: intelayerFonts.body,
  marginBottom: '6px',
}));

const ChaseOrderTerminal = () => {
  const { tokenPairs, pair, tokenPairData, assetId } = usePairTokensContext();
  const { webData2 } = useWebDataContext();
  const { direction, setDirection } = useOrderTicketContext();
  const { base, quote } = derivePairSymbols(tokenPairs, pair);
  const rawAvailableToTrade = Number(webData2.clearinghouseState?.withdrawable);
  const availableToTrade = Number.isFinite(rawAvailableToTrade)
    ? rawAvailableToTrade
    : 0;
  const currentPositionSize = getCurrentPositionSize(webData2, base);
  const szDecimals = tokenPairData[assetId]?.universe.szDecimals;

  const [radioValue, setRadioValue] = useState('');
  const [selectOrderType, setSelectOrderType] = useState('GTC');
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectItem, setSelectItem] = useState(base || `${tokenPairs[0]}`);
  const [size, setSize] = useState<number>(0);
  const [sizePercent, setSizePercent] = useState<number>(0);
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

  const priceReference = tokenPairData[assetId]?.assetCtx.markPx;
  const isBaseOrQuoteSelected =
    selectItem?.toUpperCase() === base?.toUpperCase() ||
    selectItem?.toUpperCase() === quote?.toUpperCase();

  const syncPercentWithSize = (nextSize: number) => {
    if (!priceReference || !availableToTrade) {
      setSizePercent(0);
      return;
    }

    const usdNotional =
      selectItem.toUpperCase() === 'USDC'
        ? nextSize
        : nextSize * Number(priceReference);

    const nextPercent = Math.min(100, Math.max(0, (usdNotional / availableToTrade) * 100));
    setSizePercent(Number.isFinite(nextPercent) ? Number(nextPercent.toFixed(2)) : 0);
  };

  const handleSizeInput = (value: number) => {
    setSize(value);
    syncPercentWithSize(value);
  };

  const handleSliderChange = (_: Event | React.SyntheticEvent, value: number | number[]) => {
    const percent = Array.isArray(value) ? value[0] : value;
    const normalizedPercent = Math.min(100, Math.max(0, percent));
    setSizePercent(normalizedPercent);

    const usdTarget = (availableToTrade * normalizedPercent) / 100;
    const nextSize =
      selectItem.toUpperCase() === 'USDC' || !priceReference
        ? usdTarget
        : usdTarget / Number(priceReference);

    const decimals = Number.isFinite(szDecimals) ? szDecimals : 4;
    setSize(Number(nextSize.toFixed(decimals)));
  };

  const percentInputChange = (value: string) => {
    const normalized = Number(value);
    handleSliderChange({}, Number.isFinite(normalized) ? normalized : 0);
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
            <span>Available USDC</span>
          </Tooltip>
          <span>
            {availableToTrade.toFixed(2)} {quote || 'USDC'}
          </span>
        </FlexItems>
        <FlexItems>
          <Tooltip content={orderTicketTooltips.currentPositionSize}>
            <span>Current Position</span>
          </Tooltip>
          <span>
            {currentPositionSize.toFixed(
              Number.isFinite(szDecimals) ? szDecimals : 4
            )}{' '}
            {base || quote || '—'}
          </span>
        </FlexItems>
      </Box>

      <Box sx={{ mt: '10px' }}>
        <SectionLabel>Price Movement Allowed Before Market Order</SectionLabel>
        <RenderInput
          label=""
          placeholder="5%"
          type="number"
          value={allowedBeforeMarketPurchase}
          onChange={(e: any) => setAllowedBeforeMarketPurchase(e.target.value)}
          styles={{ width: '100%' }}
        />
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.4fr)',
          gap: '12px',
          alignItems: 'flex-end',
          mt: '10px',
        }}
      >
        <Box>
          <SectionLabel>Size</SectionLabel>
          <Box sx={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <RenderInput
              label={''}
              tooltip={orderTicketTooltips.size}
              placeholder="0"
              type="number"
              value={size.toString()}
              onChange={(e: any) => handleSizeInput(Number(e.target.value))}
              styles={{ flex: 1 }}
            />
            <HandleSelectItems
              selectItem={selectItem}
              setSelectItem={setSelectItem}
              selectDataItems={[base || tokenPairs[0] || '—', quote || 'USDC', 'R']}
            />
          </Box>
        </Box>

        {isBaseOrQuoteSelected && (
          <Box>
            <SectionLabel>Size Slider</SectionLabel>
            <Box sx={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <Slider
                min={0}
                max={100}
                step={1}
                value={sizePercent}
                onChange={handleSliderChange}
                sx={{ flex: 1, '& .MuiSlider-thumb': { boxShadow: 'none' } }}
                valueLabelDisplay="auto"
                color="success"
              />
              <RenderInput
                label=""
                placeholder="0"
                value={sizePercent.toString()}
                onChange={(e: any) => percentInputChange(e.target.value)}
                styles={{ width: '80px' }}
              />
            </Box>
          </Box>
        )}
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
            <SelectionInput
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
            <SelectionInput
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
        <Box sx={{ display: 'grid', gap: '8px', mt: '10px' }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '8px',
            }}
          >
            <Box>
              <SectionLabel>TP Price</SectionLabel>
              <RenderInput
                label=""
                placeholder="0"
                type="number"
                value={takeProfitPrice}
                onChange={(e: any) => setTakeProfitPrice(e.target.value)}
                styles={{ width: '100%' }}
              />
            </Box>

            <Box>
              <SectionLabel>Gain</SectionLabel>
              <RenderInput label="" placeholder="$" styles={{ width: '100%' }} />
            </Box>
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '8px',
            }}
          >
            <Box>
              <SectionLabel>SL Price</SectionLabel>
              <RenderInput
                label=""
                placeholder="0"
                type="number"
                value={stopLossPrice}
                onChange={(e: any) => setStopLossPrice(e.target.value)}
                styles={{ width: '100%' }}
              />
            </Box>

            <Box>
              <SectionLabel>Loss</SectionLabel>
              <RenderInput label="" placeholder="$" styles={{ width: '100%' }} />
            </Box>
          </Box>
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
