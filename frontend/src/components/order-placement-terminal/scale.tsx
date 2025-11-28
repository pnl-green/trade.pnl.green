import { Box, Slider, styled } from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';
import HandleSelectItems from '../handleSelectItems';
import { BuySellBtn, FlexItems } from '@/styles/common.styles';
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
import { intelayerColors, intelayerFonts } from '@/styles/theme';
import toast from 'react-hot-toast';

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

const ScaleOrderTerminal = () => {
  const { webData2 } = useWebDataContext();
  const { tokenPairs, pair, tokenPairData, assetId } = usePairTokensContext();
  const { establishedConnection, handleEstablishConnection } =
    useHyperLiquidContext();
  const { direction } = useOrderTicketContext();
  const { base, quote } = derivePairSymbols(tokenPairs, pair);
  const currentPositionSize = getCurrentPositionSize(webData2, base);

  const [isLoading, setIsLoading] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectItem, setSelectItem] = useState(base || `${tokenPairs[0]}`);
  const [size, setSize] = useState<number>(0);
  const [sizePercent, setSizePercent] = useState<number>(0);
  const [reduceOnly, setReduceOnly] = useState(false);
  const [selectOrderType, setSelectOrderType] = useState<'Gtc' | 'Ioc' | 'Fok'>(
    'Gtc'
  );
  const [tpSlEnabled, setTpSlEnabled] = useState(false);

  const [establishConnModal, setEstablishedConnModal] = useState(false);

  const [takeProfitPrice, setTakeProfitPrice] = useState('');
  const [stopLossPrice, setStopLossPrice] = useState('');
  const [gain, setGain] = useState('');
  const [loss, setLoss] = useState('');

  const [startPrice, setStartPrice] = useState<string>('');
  const [endPrice, setEndPrice] = useState<string>('');
  const [totalNoOfOrders, setTotalNoOfOrders] = useState<string>('');
  const [sizeSkew, setSizeSkew] = useState<string>('1.00');

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

  const sizeNotional = useMemo(() => {
    const numericSize = Number(size) || 0;
    if (selectItem.toUpperCase() === 'USDC') return numericSize;
    if (!priceReference) return 0;
    return numericSize * priceReference;
  }, [priceReference, selectItem, size]);

  const summaryOrderValue = sizeNotional
    ? `${sizeNotional.toFixed(2)} USDC`
    : '—';
  const summaryStartPrice = startPrice ? `${startPrice} USDC` : '—';
  const summaryEndPrice = endPrice ? `${endPrice} USDC` : '—';
  const summaryMarginRequired = sizeNotional
    ? `${(sizeNotional * 0.1).toFixed(2)} USDC`
    : '—';

  const handlePlaceScaleOrder = () => {
    try {
      setConfirmModalOpen(false);
      // TODO: hook this up to actual scale order placement logic
      toast.success('Submitted scale order');
    } catch (error) {
      console.error(error);
      toast.error('Error placing order, please try again later.');
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
            {currentPositionSize.toFixed(
              Number.isFinite(szDecimals) ? szDecimals : 4
            )}{' '}
            {base || quote || '—'}
          </span>
        </FlexItems>
      </Box>

      <Box sx={{ display: 'grid', gap: '10px' }}>
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

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '8px',
          }}
        >
          <Box>
            <SectionLabel>Start (USDC)</SectionLabel>
            <RenderInput
              label=""
              placeholder="0"
              type="number"
              value={startPrice}
              onChange={(e: any) => setStartPrice(e.target.value)}
              styles={{ width: '100%' }}
            />
          </Box>
          <Box>
            <SectionLabel>End (USDC)</SectionLabel>
            <RenderInput
              label=""
              placeholder="0"
              type="number"
              value={endPrice}
              onChange={(e: any) => setEndPrice(e.target.value)}
              styles={{ width: '100%' }}
            />
          </Box>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '8px',
          }}
        >
          <Box>
            <SectionLabel>Total Orders</SectionLabel>
            <RenderInput
              label=""
              placeholder="0"
              type="number"
              value={totalNoOfOrders}
              onChange={(e: any) => setTotalNoOfOrders(e.target.value)}
              styles={{ width: '100%' }}
            />
          </Box>
          <Box>
            <SectionLabel>Size Skew</SectionLabel>
            <RenderInput
              label=""
              placeholder="1.00"
              type="number"
              value={sizeSkew}
              onChange={(e: any) => setSizeSkew(e.target.value)}
              styles={{ width: '100%' }}
            />
          </Box>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '8px',
            alignItems: 'center',
          }}
        >
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

          <HandleSelectItems
            selectItem={selectOrderType}
            setSelectItem={setSelectOrderType as any}
            selectDataItems={['Gtc', 'Ioc', 'Fok']}
          />
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
          <Box sx={{ display: 'grid', gap: '8px' }}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
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
                  type="number"
                  value={gain}
                  onChange={(e: any) => setGain(e.target.value)}
                  styles={{ width: '100%' }}
                />
              </Box>
            </Box>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
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
                  type="number"
                  value={loss}
                  onChange={(e: any) => setLoss(e.target.value)}
                  styles={{ width: '100%' }}
                />
              </Box>
            </Box>
          </Box>
        )}
      </Box>

      {establishedConnection ? (
        <BuySellBtn
          className={direction === 'buy' ? 'buyBtn' : 'sellBtn'}
          onClick={() => setConfirmModalOpen(true)}
        >
          {direction === 'buy' ? `Buy ${base}` : `Sell ${base}`}
        </BuySellBtn>
      ) : (
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
      )}

      <Box sx={{ display: 'grid', gap: '8px' }}>
        <SectionLabel>Summary</SectionLabel>
        <SummaryRow>
          <span>Start Price</span>
          <span>{summaryStartPrice}</span>
        </SummaryRow>
        <SummaryRow>
          <span>End Price</span>
          <span>{summaryEndPrice}</span>
        </SummaryRow>
        <SummaryRow>
          <span>Order Value</span>
          <span>{summaryOrderValue}</span>
        </SummaryRow>
        <SummaryRow>
          <span>Margin Required</span>
          <span>{summaryMarginRequired}</span>
        </SummaryRow>
        <SummaryRow>
          <span>Fees</span>
          <span>{fee ? `${fee} USDC` : '—'}</span>
        </SummaryRow>
      </Box>

      {confirmModalOpen && (
        <ConfirmationModal
          onClose={() => setConfirmModalOpen(false)}
          onConfirm={handlePlaceScaleOrder}
          isScale={true}
          size={`${size} ${selectItem}`}
          isTpSl={!!takeProfitPrice || !!stopLossPrice}
          takeProfitPrice={takeProfitPrice || undefined}
          stopLossPrice={stopLossPrice || undefined}
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

      <LiquidationContent />
    </Box>
  );
};

export default ScaleOrderTerminal;
