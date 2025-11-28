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

const SummaryRow = styled(Box)(() => ({
  display: 'flex',
  justifyContent: 'space-between',
  padding: '8px 12px',
  borderRadius: '10px',
  background: 'rgba(255, 255, 255, 0.02)',
  border: `1px solid ${intelayerColors.panelBorder}`,
  fontFamily: intelayerFonts.body,
  fontSize: '12px',
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

  const availableToTrade =
    Number(webData2.clearinghouseState?.withdrawable) || 0;
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

  const ordersCount = useMemo(
    () => Math.max(0, Number(totalNoOfOrders) || 0),
    [totalNoOfOrders]
  );

  const frequencySeconds = useMemo(() => {
    if (!ordersCount || !runtimeInMinutes) return 0;
    return (runtimeInMinutes * 60) / ordersCount;
  }, [ordersCount, runtimeInMinutes]);

  const formatDuration = (minutes: number) => {
    if (!minutes) return '—';
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const parts: string[] = [];
    if (hrs) parts.push(`${hrs}h`);
    if (mins) parts.push(`${mins}m`);
    return parts.length ? parts.join(' ') : '0m';
  };

  const formatFrequency = (seconds: number) => {
    if (!seconds) return '—';
    if (seconds < 60) return `${seconds.toFixed(0)}s`;
    const mins = seconds / 60;
    return formatDuration(Math.round(mins));
  };

  const sizePerOrder = useMemo(() => {
    if (!ordersCount) return 0;
    return (Number(size) || 0) / ordersCount;
  }, [ordersCount, size]);

  const sizeDecimals = Number.isFinite(szDecimals) ? szDecimals : 4;
  const sizeSummaryLabel = ordersCount
    ? `${sizePerOrder.toFixed(sizeDecimals)} ${selectItem}`
    : '—';

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
            {currentPositionSize.toFixed(
              Number.isFinite(szDecimals) ? szDecimals : 4
            )}{' '}
            {base || quote || '—'}
          </span>
        </FlexItems>
      </Box>

      <Box>
        <SectionLabel>Total Size</SectionLabel>
        <Box sx={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <RenderInput
            label=""
            tooltip={orderTicketTooltips.size}
            placeholder="|"
            type="number"
            value={size}
            onChange={(e: any) => handleSizeInput(e.target.value)}
            styles={{
              background: 'transparent',
              flex: 1,
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
              label="%"
              placeholder="0"
              value={sizePercent.toString()}
              onChange={(e: any) => percentInputChange(e.target.value)}
              styles={{
                width: '80px',
                '.placeholder_box': {
                  width: '60%',
                },
                input: { width: '100%', padding: 0 },
              }}
            />
          </Box>
        </Box>
      )}

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
            <RenderInput
              label="Hour(s)"
              placeholder="0"
              type="number"
              value={runtimeHours}
              onChange={(e: any) => setRuntimeHours(e.target.value)}
              styles={{
                '.placeholder_box': { fontSize: '12px' },
                input: { width: '100%' },
              }}
            />
            <RenderInput
              label="Minute(s)"
              placeholder="5"
              type="number"
              value={runtimeMinutes}
              onChange={(e: any) => setRuntimeMinutes(e.target.value)}
              styles={{
                '.placeholder_box': { fontSize: '12px' },
                input: { width: '100%' },
              }}
            />
            <RenderInput
              label="Orders"
              placeholder="5"
              type="number"
              value={totalNoOfOrders}
              onChange={(e: any) => setTotalNoOfOrders(e.target.value)}
              styles={{
                '.placeholder_box': { fontSize: '12px' },
                input: { width: '100%' },
              }}
            />
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          <CheckboxLabel>
            <input
              type="checkbox"
              checked={randomize}
              onChange={(e) => setRandomize(e.target.checked)}
            />
            <span>Randomize</span>
          </CheckboxLabel>
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
        </Box>

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
          <Box
            sx={{
              display: 'grid',
              gap: '8px',
            }}
          >
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '8px',
              }}
            >
              <RenderInput
                label="TP Price"
                placeholder="0"
                type="number"
                value={takeProfitPrice}
                onChange={(e: any) => setTakeProfitPrice(e.target.value)}
                styles={{
                  gap: 0,
                  '.placeholder_box': {
                    fontSize: '12px',
                  },
                  input: { width: '100%', padding: '0' },
                }}
              />

              <RenderInput
                label="Gain"
                placeholder="$"
                value={gain}
                onChange={(e: any) => setGain(e.target.value)}
                styles={{
                  gap: 0,
                  '.placeholder_box': {
                    fontSize: '12px',
                  },
                  input: { width: '100%', padding: '0' },
                }}
              />
            </Box>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '8px',
              }}
            >
              <RenderInput
                label="SL Price"
                placeholder="0"
                type="number"
                value={stopLossPrice}
                onChange={(e: any) => setStopLossPrice(e.target.value)}
                styles={{
                  gap: 0,
                  '.placeholder_box': {
                    fontSize: '12px',
                  },
                  input: { width: '100%', padding: '0' },
                }}
              />

              <RenderInput
                label="Loss"
                placeholder="$"
                value={loss}
                onChange={(e: any) => setLoss(e.target.value)}
                styles={{
                  gap: 0,
                  '.placeholder_box': {
                    fontSize: '12px',
                  },
                  input: { width: '100%', padding: '0' },
                }}
              />
            </Box>
          </Box>
        )}
      </Box>

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

      <Box sx={{ display: 'grid', gap: '8px' }}>
        <SectionLabel>Summary</SectionLabel>
        <SummaryRow>
          <span>Frequency</span>
          <span>{formatFrequency(frequencySeconds)}</span>
        </SummaryRow>
        <SummaryRow>
          <span>Runtime</span>
          <span>{formatDuration(runtimeInMinutes)}</span>
        </SummaryRow>
        <SummaryRow>
          <span>Number of Orders</span>
          <span>{ordersCount || '—'}</span>
        </SummaryRow>
        <SummaryRow>
          <span>Size per Suborder</span>
          <span>{sizeSummaryLabel}</span>
        </SummaryRow>
        <SummaryRow>
          <span>Fees</span>
          <span>{fee ? `${fee} USDC` : '—'}</span>
        </SummaryRow>
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

      <LiquidationContent />
    </Box>
  );
};

export default TwapOrderTerminal;
