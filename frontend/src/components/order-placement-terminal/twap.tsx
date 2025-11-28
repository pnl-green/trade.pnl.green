import React, { useEffect, useMemo, useState } from 'react';
import { Box, Slider, styled } from '@mui/material';
import HandleSelectItems from '../handleSelectItems';
import { RenderInput } from './commonInput';
import { BuySellBtn, FlexItems } from '@/styles/common.styles';
import ConfirmationModal from '../Modals/confirmationModals';
import LiquidationContent from './liquidationContent';
import { useWebDataContext } from '@/context/webDataContext';
import { usePairTokensContext } from '@/context/pairTokensContext';
import toast from 'react-hot-toast';
import EstablishConnectionModal from '../Modals/establishConnectionModal';
import { useHyperLiquidContext } from '@/context/hyperLiquidContext';
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

const TwapOrderTerminal = () => {
  const { webData2 } = useWebDataContext();
  const { tokenPairs, pair, tokenPairData, assetId } = usePairTokensContext();
  const { establishedConnection, handleEstablishConnection } =
    useHyperLiquidContext();
  const { direction } = useOrderTicketContext();
  const { base, quote } = derivePairSymbols(tokenPairs, pair);
  const currentPositionSize = getCurrentPositionSize(webData2, base);

  const [isLoading, setIsLoading] = useState(false);
  const [reduceOnly, setReduceOnly] = useState(false);
  const [randomize, setRandomize] = useState(false);
  const [tpSlEnabled, setTpSlEnabled] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectItem, setSelectItem] = useState(base || `${tokenPairs[0]}`);
  const [size, setSize] = useState<number>(0);
  const [sizePercent, setSizePercent] = useState<number>(0);
  const [runtimeHours, setRuntimeHours] = useState<string>('0');
  const [runtimeMinutes, setRuntimeMinutes] = useState<string>('5');
  const [totalNoOfOrders, setTotalNoOfOrders] = useState<string>('5');

  const [establishConnModal, setEstablishedConnModal] = useState(false);

  const [takeProfitPrice, setTakeProfitPrice] = useState('');
  const [stopLossPrice, setStopLossPrice] = useState('');
  const [gain, setGain] = useState('');
  const [loss, setLoss] = useState('');

  const [estLiqPrice, setEstLiquidationPrice] = useState('100');
  const [fee, setFee] = useState('100');

  const rawAvailableToTrade = Number(webData2.clearinghouseState?.withdrawable);
  const availableToTrade = Number.isFinite(rawAvailableToTrade)
    ? rawAvailableToTrade
    : 0;
  const currentMarketPrice = tokenPairData[assetId]?.assetCtx.markPx;
  const szDecimals = tokenPairData[assetId]?.universe.szDecimals;
  const priceReference = Number(currentMarketPrice) || 0;
  const isBaseOrQuoteSelected =
    selectItem?.toUpperCase() === base?.toUpperCase() ||
    selectItem?.toUpperCase() === quote?.toUpperCase();

  useEffect(() => {
    setSelectItem(base || `${tokenPairs[0]}`);
  }, [base, tokenPairs]);

  const handleSliderChange = (
    _: Event | React.SyntheticEvent,
    value: number | number[]
  ) => {
    const percent = Array.isArray(value) ? value[0] : value;
    const normalizedPercent = Math.min(100, Math.max(0, percent));
    setSizePercent(normalizedPercent);

    const usdTarget = (availableToTrade * normalizedPercent) / 100;
    const nextSize =
      selectItem.toUpperCase() === 'USDC' || !priceReference
        ? usdTarget
        : usdTarget / Number(priceReference || 1);

    const decimals = Number.isFinite(szDecimals) ? szDecimals : 4;
    setSize(Number(nextSize.toFixed(decimals)));
  };

  const syncPercentWithSize = (rawValue: string) => {
    const numeric = Number(rawValue);
    if (!numeric || !availableToTrade) {
      setSizePercent(0);
      return;
    }

    const usdNotional =
      selectItem.toUpperCase() === 'USDC'
        ? numeric
        : numeric * Number(priceReference || 0);

    if (selectItem.toUpperCase() !== 'USDC' && !priceReference) {
      setSizePercent(0);
      return;
    }

    const pct = Math.min(
      100,
      Math.max(0, (usdNotional / availableToTrade) * 100)
    );
    setSizePercent(Number(pct.toFixed(2)));
  };

  const handleSizeInput = (rawValue: string) => {
    const numeric = Number(rawValue);
    setSize(Number.isNaN(numeric) ? 0 : numeric);
    syncPercentWithSize(rawValue);
  };

  const percentInputChange = (value: string) => {
    const numeric = Number(value);
    if (Number.isNaN(numeric)) return;
    handleSliderChange({} as any, numeric);
  };

  const handlePlaceTwapOrder = () => {
    try {
      setConfirmModalOpen(false);
      // TODO: hook into real TWAP placement logic
      toast.success('Submitted TWAP order');
    } catch (error) {
      console.log(error);
      toast.error('Error placing order, please try again later.');
    }
  };

  const runtimeInMinutes = useMemo(() => {
    const hours = Number(runtimeHours) || 0;
    const minutes = Number(runtimeMinutes) || 0;
    return Math.max(0, hours * 60 + minutes);
  }, [runtimeHours, runtimeMinutes]);

  const formatDuration = (minutes: number) => {
    if (!minutes) return '—';
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const parts: string[] = [];
    if (hrs) parts.push(`${hrs}h`);
    if (mins) parts.push(`${mins}m`);
    return parts.length ? parts.join(' ') : '0m';
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <DirectionSelector />

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '5px', mt: '4px' }}>
        <FlexItems>
          <Tooltip content={orderTicketTooltips.availableBalance}>
            <span>Available USDC</span>
          </Tooltip>
          <span>{availableToTrade.toFixed(2)} {quote || 'USDC'}</span>
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
              type="number"
              value={size}
              onChange={(e: any) => handleSizeInput(e.target.value)}
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

      <Box sx={{ display: 'grid', gap: '10px' }}>
        <Box>
          <SectionLabel>Running Time (5m - 24h)</SectionLabel>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: '8px',
            }}
          >
            <Box>
              <SectionLabel>Hour(s)</SectionLabel>
              <RenderInput
                label=""
                placeholder="0"
                type="number"
                value={runtimeHours}
                onChange={(e: any) => setRuntimeHours(e.target.value)}
                styles={{ width: '100%' }}
              />
            </Box>
            <Box>
              <SectionLabel>Minute(s)</SectionLabel>
              <RenderInput
                label=""
                placeholder="5"
                type="number"
                value={runtimeMinutes}
                onChange={(e: any) => setRuntimeMinutes(e.target.value)}
                styles={{ width: '100%' }}
              />
            </Box>
            <Box>
              <SectionLabel>Orders</SectionLabel>
              <RenderInput
                label=""
                placeholder="5"
                type="number"
                value={totalNoOfOrders}
                onChange={(e: any) => setTotalNoOfOrders(e.target.value)}
                styles={{ width: '100%' }}
              />
            </Box>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          <CheckboxLabel>
            <SelectionInput
              type="checkbox"
              checked={randomize}
              onChange={(e) => setRandomize(e.target.checked)}
            />
            <span>Randomize</span>
          </CheckboxLabel>
          <CheckboxLabel>
            <SelectionInput
              type="checkbox"
              checked={reduceOnly}
              onChange={(e) => setReduceOnly(e.target.checked)}
            />
            <Tooltip content={orderTicketTooltips.reduceOnly}>
              <span>Reduce Only</span>
            </Tooltip>
          </CheckboxLabel>
        </Box>

        <CheckboxLabel>
          <SelectionInput
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
                gridTemplateColumns:
                  'repeat(auto-fit, minmax(180px, 1fr))',
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
                <RenderInput
                  label=""
                  placeholder="$"
                  value={gain}
                  onChange={(e: any) => setGain(e.target.value)}
                  styles={{ width: '100%' }}
                />
              </Box>
            </Box>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit, minmax(180px, 1fr))',
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
                <RenderInput
                  label=""
                  placeholder="$"
                  value={loss}
                  onChange={(e: any) => setLoss(e.target.value)}
                  styles={{ width: '100%' }}
                />
              </Box>
            </Box>
          </Box>
        )}
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) auto' },
          gap: '12px',
          alignItems: 'center',
          mt: '12px',
        }}
      >
        <LiquidationContent />

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
          <BuySellBtn
            className={direction === 'buy' ? 'buyBtn' : 'sellBtn'}
            onClick={() => setConfirmModalOpen(true)}
          >
            {direction === 'buy' ? `Buy ${base}` : `Sell ${base}`}
          </BuySellBtn>
        )}
      </Box>

      {confirmModalOpen && (
        <ConfirmationModal
          onClose={() => setConfirmModalOpen(false)}
          onConfirm={handlePlaceTwapOrder}
          isTwap={true}
          size={`${size} ${selectItem}`}
          timeBetweenIntervals={formatDuration(runtimeInMinutes)}
          noOfOrders={totalNoOfOrders}
          isTpSl={tpSlEnabled}
          takeProfitPrice={tpSlEnabled ? takeProfitPrice : undefined}
          stopLossPrice={tpSlEnabled ? stopLossPrice : undefined}
          estLiqPrice={estLiqPrice}
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

    </Box>
  );
};

export default TwapOrderTerminal;
