import { Box, Slider, styled } from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';
import HandleSelectItems from '../handleSelectItems';
import { BuySellBtn, FlexItems } from '@/styles/common.styles';
import { RenderInput } from './commonInput';
import ConfirmationModal from '../Modals/confirmationModals';
import LiquidationContent from './liquidationContent';
import { useWebDataContext } from '@/context/webDataContext';
import { usePairTokensContext } from '@/context/pairTokensContext';
import { useHyperLiquidContext } from '@/context/hyperLiquidContext';
import { parsePrice, parseSize } from '@/utils/hyperliquid';
import toast from 'react-hot-toast';
import { OrderType } from '@/types/hyperliquid';
import { getUsdSizeEquivalents } from '@/utils/usdEquivalents';
import EstablishConnectionModal from '../Modals/establishConnectionModal';
import Tooltip from '../ui/Tooltip';
import { orderTicketTooltips } from './tooltipCopy';
import { useOrderTicketContext } from '@/context/orderTicketContext';
import DirectionSelector from './DirectionSelector';
import { derivePairSymbols, getCurrentPositionSize } from '@/utils';
import { intelayerColors, intelayerFonts } from '@/styles/theme';
import { useOrderBookTradesContext } from '@/context/orderBookTradesContext';

const PresetButton = styled('button')(() => ({
  border: `1px solid ${intelayerColors.panelBorder}`,
  background: 'rgba(255, 255, 255, 0.02)',
  color: intelayerColors.muted,
  borderRadius: '8px',
  padding: '6px 10px',
  cursor: 'pointer',
  fontFamily: intelayerFonts.body,
  fontSize: '12px',
  transition: 'all 0.15s ease',
  '&:hover': {
    borderColor: intelayerColors.green[500],
    color: intelayerColors.green[500],
  },
}));

const SectionLabel = styled('div')(() => ({
  fontSize: '12px',
  color: intelayerColors.subtle,
  marginBottom: '6px',
  fontFamily: intelayerFonts.body,
}));

const CheckboxLabel = styled('label')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  cursor: 'pointer',
  fontFamily: intelayerFonts.body,
  fontSize: '13px',
}));

const LimitComponent = () => {
  const { webData2 } = useWebDataContext();
  const { hyperliquid, establishedConnection, handleEstablishConnection } =
    useHyperLiquidContext();
  const { tokenPairs, tokenPairData, assetId, pair } = usePairTokensContext();
  const { bookData } = useOrderBookTradesContext();

  const availableToTrade = Number(webData2.clearinghouseState?.withdrawable) || 0;
  const { base, quote } = derivePairSymbols(tokenPairs, pair);
  const currentPositionSize = getCurrentPositionSize(webData2, base);

  const {
    direction,
    setDirection,
    tpSlEnabled,
    setTpSlEnabled,
    limitPrice,
    setLimitPrice,
    stopLoss,
    setStopLoss,
    takeProfits,
    setTakeProfits,
  } = useOrderTicketContext();

  const [selectOrderType, setSelectOrderType] = useState<
    'Gtc' | 'Ioc' | 'Alo' | 'FrontendMarket'
  >('Gtc');
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectItem, setSelectItem] = useState(base || `${tokenPairs[0]}`);
  const [size, setSize] = useState<number>(0.0);
  const [isLoading, setIsLoading] = useState(false);
  const [establishConnModal, setEstablishedConnModal] = useState(false);
  const [reduceOnly, setReduceOnly] = useState(false);
  const [sizePercent, setSizePercent] = useState<number>(0);
  const isBaseOrQuoteSelected =
    selectItem?.toUpperCase() === base?.toUpperCase() ||
    selectItem?.toUpperCase() === quote?.toUpperCase();

  const takeProfitPrice = takeProfits[0] ?? '';
  const currentMarketPrice = tokenPairData[assetId]?.assetCtx.markPx;
  const szDecimals = tokenPairData[assetId]?.universe.szDecimals;

  const bestBid = useMemo(
    () => [...bookData.bids].sort((a, b) => b.px - a.px)[0]?.px,
    [bookData.bids]
  );
  const bestAsk = useMemo(
    () => [...bookData.asks].sort((a, b) => a.px - b.px)[0]?.px,
    [bookData.asks]
  );
  const midPrice = useMemo(() => {
    if (!bestBid || !bestAsk) return undefined;
    return (Number(bestBid) + Number(bestAsk)) / 2;
  }, [bestAsk, bestBid]);

  const toggleConfirmModal = (button: string) => {
    setConfirmModalOpen(true);
    setDirection(button as 'buy' | 'sell');
  };

  const pricePresets = {
    mid: midPrice,
    bid: bestBid,
    ask: bestAsk,
  };

  const setPriceFromPreset = (value?: number) => {
    if (!value || Number.isNaN(value)) return;
    const decimals = Math.max(2, szDecimals ?? 2);
    setLimitPrice(value.toFixed(decimals));
  };

  useEffect(() => {
    setSelectItem(base || `${tokenPairs[0]}`);
  }, [base, tokenPairs]);

  //setting the equivalent size in the selected token
  const TokenSize = getUsdSizeEquivalents({
    size: Number(size),
    currentMarkPrice: Number(currentMarketPrice),
    token: selectItem,
  });

  //maintain the size equivalent state of the  token
  useEffect(() => {
    if (TokenSize !== undefined && TokenSize !== null) {
      const decimals = Number.isFinite(szDecimals) ? szDecimals : 4;
      const newSize = Number(Number(TokenSize).toFixed(decimals));
      setSize(newSize);
    }
  }, [selectItem]);

  const priceReference = Number(currentMarketPrice) || 0;

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

  const limitPx = Number(limitPrice);
  const sz = selectItem.toUpperCase() === 'USDC' ? size / Number(priceReference || 1) : size;

  const handlePlaceOrder = async () => {
    try {
      setIsLoading(true);
      const orderType: OrderType = {
        limit: {
          tif: selectOrderType,
        },
      };

      const { success, data, msg } = await hyperliquid.placeOrder({
        asset: Number(assetId),
        isBuy: direction === 'buy',
        limitPx: parsePrice(Number(limitPx)),
        sz: parseSize(sz, szDecimals),
        orderType,
        reduceOnly,
      });

      if (success) {
        setIsLoading(false);
        setConfirmModalOpen(false);

        if (
          data &&
          typeof data === 'object' &&
          'data' in data &&
          data.type === 'order' &&
          data.data &&
          data.data.statuses &&
          data.data.statuses.length > 0 &&
          data.data.statuses[0].error
        ) {
          toast.error(
            (
              data.data.statuses[0].error || 'Error ocured please try again'
            ).toString()
          );
        } else {
          toast.success('Order placed successfully');
        }
      } else {
        setIsLoading(false);
        toast.error((msg || 'Error ocured please try again').toString());
      }
    } catch (error) {
      console.log('error', error);
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <DirectionSelector />

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '5px', mt: '4px' }}>
        <FlexItems>
          <Tooltip content={orderTicketTooltips.availableBalance}>
            <span>Available</span>
          </Tooltip>
          <span>{availableToTrade.toFixed(2)} {quote || 'USDC'}</span>
        </FlexItems>
        <FlexItems>
          <Tooltip content={orderTicketTooltips.currentPositionSize}>
            <span>Position</span>
          </Tooltip>
          <span>
            {currentPositionSize.toFixed(Number.isFinite(szDecimals) ? szDecimals : 4)} {base || quote || '—'}
          </span>
        </FlexItems>
      </Box>

      <Box>
        <SectionLabel>Price (USDC)</SectionLabel>
        <Box sx={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <RenderInput
              label=""
              tooltip={orderTicketTooltips.price}
              placeholder="0"
              type="number"
              value={limitPrice?.toString() ?? ''}
              onChange={(e: any) => setLimitPrice(e.target.value)}
              styles={{
                flex: 1,
                marginTop: 0,
                gap: 0,
                width: '100%',
              }}
            />
          <Box sx={{ display: 'flex', gap: '6px' }}>
            <PresetButton onClick={() => setPriceFromPreset(pricePresets.bid)}>Best Bid</PresetButton>
            <PresetButton onClick={() => setPriceFromPreset(pricePresets.mid)}>Mid</PresetButton>
            <PresetButton onClick={() => setPriceFromPreset(pricePresets.ask)}>Best Ask</PresetButton>
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.4fr)',
          gap: '12px',
          alignItems: 'flex-end',
        }}
      >
        <Box>
          <SectionLabel>Size</SectionLabel>
          <Box sx={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <RenderInput
              label=""
              tooltip={orderTicketTooltips.size}
              placeholder="0"
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
                onChange={(e: any) => handleSliderChange({}, Number(e.target.value))}
                styles={{ width: '80px' }}
              />
            </Box>
          </Box>
        )}
      </Box>

      <FlexItems sx={{ gap: '10px' }}>
        <CheckboxLabel>
          <input
            type="checkbox"
            checked={reduceOnly}
            onChange={(e) => setReduceOnly(e.target.checked)}
          />
          <Tooltip content={orderTicketTooltips.reduceOnly}>
            <span>Reduce Only</span>
          </Tooltip>
        </CheckboxLabel>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: intelayerColors.subtle }}>TIF</span>
          <HandleSelectItems
            selectItem={selectOrderType}
            setSelectItem={setSelectOrderType}
            selectDataItems={['Gtc', 'Ioc', 'Alo']}
          />
        </Box>
      </FlexItems>

      <CheckboxLabel>
        <input
          type="checkbox"
          checked={tpSlEnabled}
          onChange={(e) => setTpSlEnabled(e.target.checked)}
        />
        <Tooltip content={orderTicketTooltips.takeProfitStopLoss}>
          <span>Take Profit / Stop Loss</span>
        </Tooltip>
      </CheckboxLabel>

      {tpSlEnabled && (
        <Box sx={{ display: 'grid', gap: '8px' }}>
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
                value={takeProfitPrice}
                onChange={(e: any) => setTakeProfits([e.target.value])}
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
                value={stopLoss}
                onChange={(e: any) => setStopLoss(e.target.value)}
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

      {!establishedConnection ? (
        <Box sx={{ display: 'flex', gap: '10px', width: '100%' }}>
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
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <BuySellBtn
            className="buyBtn"
            onClick={() => toggleConfirmModal('buy')}
          >
            Buy {base}
          </BuySellBtn>
          <BuySellBtn
            className="sellBtn"
            onClick={() => toggleConfirmModal('sell')}
          >
            Sell {base}
          </BuySellBtn>
        </Box>
      )}

      {confirmModalOpen && (
        <ConfirmationModal
          onClose={() => setConfirmModalOpen(false)}
          onConfirm={handlePlaceOrder}
          isLimit={true}
          size={`${parseSize(sz, szDecimals)} ${tokenPairs[0]}`}
          price={limitPrice}
          isTpSl={tpSlEnabled}
          takeProfitPrice={tpSlEnabled ? takeProfits[0] : undefined}
          stopLossPrice={tpSlEnabled ? stopLoss : undefined}
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

      <LiquidationContent />
    </Box>
  );
};

export default LimitComponent;
