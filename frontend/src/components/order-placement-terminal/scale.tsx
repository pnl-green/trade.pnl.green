import { Box, Slider, styled } from '@mui/material';
import React, { useEffect, useState } from 'react';
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

const InlineStat = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '10px 12px',
  background: 'rgba(255, 255, 255, 0.02)',
  borderRadius: '10px',
  border: `1px solid ${intelayerColors.panelBorder}`,
  fontFamily: intelayerFonts.body,
  fontSize: '13px',
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

const ScaleOrderTerminal = () => {
  const { webData2 } = useWebDataContext();
  const { tokenPairs, pair, tokenPairData, assetId } = usePairTokensContext();
  const { establishedConnection, handleEstablishConnection } =
    useHyperLiquidContext();
  const { direction, setDirection } = useOrderTicketContext();
  const { base, quote } = derivePairSymbols(tokenPairs, pair);
  const currentPositionSize = getCurrentPositionSize(webData2, base);

  const [isLoading, setIsLoading] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectItem, setSelectItem] = useState(base || `${tokenPairs[0]}`);
  const [size, setSize] = useState('');
  const [sizePercent, setSizePercent] = useState<number>(0);
  const [reduceOnly, setReduceOnly] = useState(false);

  const [establishConnModal, setEstablishedConnModal] = useState(false);

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

  const availableToTrade = Number(webData2.clearinghouseState?.withdrawable) || 0;
  const currentMarketPrice = tokenPairData[assetId]?.assetCtx.markPx;
  const szDecimals = tokenPairData[assetId]?.universe.szDecimals;
  const priceReference = Number(currentMarketPrice) || 0;

  useEffect(() => {
    setSelectItem(base || `${tokenPairs[0]}`);
  }, [base, tokenPairs]);

  const toggleConfirmModal = (button: string) => {
    setConfirmModalOpen(true);
    setDirection(button as 'buy' | 'sell');
  };

  const handleSliderChange = (_: Event | React.SyntheticEvent, value: number | number[]) => {
    const percent = Array.isArray(value) ? value[0] : value;
    const normalizedPercent = Math.min(100, Math.max(0, percent));
    setSizePercent(normalizedPercent);

    const usdTarget = (availableToTrade * normalizedPercent) / 100;
    const nextSize =
      selectItem.toUpperCase() === 'USDC' || !priceReference
        ? usdTarget
        : usdTarget / Number(priceReference || 1);

    const decimals = Number.isFinite(szDecimals) ? szDecimals : 4;
    setSize(Number(nextSize.toFixed(decimals)).toString());
  };

  const syncPercentWithSize = (rawValue: string) => {
    const numeric = Number(rawValue);
    if (!numeric || !availableToTrade || !priceReference) {
      setSizePercent(0);
      return;
    }

    const usdNotional =
      selectItem.toUpperCase() === 'USDC'
        ? numeric
        : numeric * Number(priceReference);
    const pct = Math.min(100, Math.max(0, (usdNotional / availableToTrade) * 100));
    setSizePercent(Number(pct.toFixed(2)));
  };

  const handleSizeInput = (rawValue: string) => {
    setSize(rawValue);
    syncPercentWithSize(rawValue);
  };

  const percentInputChange = (value: string) => {
    const numeric = Number(value);
    if (Number.isNaN(numeric)) return;
    handleSliderChange({} as any, numeric);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <DirectionSelector />

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        <InlineStat>
          <Tooltip content={orderTicketTooltips.availableBalance}>
            <span>Available to Trade</span>
          </Tooltip>
          <span>{availableToTrade.toFixed(2)} USDC</span>
        </InlineStat>
        <InlineStat>
          <Tooltip content={orderTicketTooltips.currentPositionSize}>
            <span>Current Position</span>
          </Tooltip>
          <span>
            {currentPositionSize.toFixed(Number.isFinite(szDecimals) ? szDecimals : 4)} {base || quote || '—'}
          </span>
        </InlineStat>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <Box>
          <SectionLabel>Size</SectionLabel>
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
          </Box>
        </Box>

        <Box>
          <SectionLabel>Size Slider</SectionLabel>
          <Box sx={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Slider
              min={0}
              max={100}
              step={1}
              value={sizePercent}
              onChange={handleSliderChange}
              sx={{ flex: 1 }}
              valueLabelDisplay="auto"
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
                  fontSize: '12px',
                },
                input: { width: '100%', padding: 0 },
              }}
            />
          </Box>
        </Box>

        <FlexItems>
          <RenderInput
            label="Start price"
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

      <CheckboxLabel>
        <input
          type="checkbox"
          checked={!!takeProfitPrice || !!stopLossPrice}
          onChange={(e) => {
            if (!e.target.checked) {
              setTakeProfitPrice('');
              setStopLossPrice('');
            }
          }}
        />
        <Tooltip content={orderTicketTooltips.takeProfitStopLoss}>
          <span>Take Profit / Stop Loss</span>
        </Tooltip>
      </CheckboxLabel>

      {(!!takeProfitPrice || !!stopLossPrice) && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
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

      {confirmModalOpen && (
        <ConfirmationModal
          onClose={() => setConfirmModalOpen(false)}
          onConfirm={function (): void {
            throw new Error('Function not implemented.');
          }}
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
