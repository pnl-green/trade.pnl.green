import { SelectItemsBox } from '@/styles/riskManager.styles';
import { Box } from '@mui/material';
import React, { useEffect, useState } from 'react';
import HandleSelectItems from '../handleSelectItems';
import { ButtonStyles, BuySellBtn, FlexItems } from '@/styles/common.styles';
import { intelayerColors } from '@/styles/theme';
import { RenderInput } from './commonInput';
import { usePairTokensContext } from '@/context/pairTokensContext';
import ConfirmationModal from '../Modals/confirmationModals';
import { OrderType } from '@/types/hyperliquid';
import { useHyperLiquidContext } from '@/context/hyperLiquidContext';
import { parsePrice, parseSize } from '@/utils/hyperliquid';
import toast from 'react-hot-toast';
import LiquidationContent from './liquidationContent';
import { useWebDataContext } from '@/context/webDataContext';
import { getUsdSizeEquivalents } from '@/utils/usdEquivalents';
import EstablishConnectionModal from '../Modals/establishConnectionModal';
import { useOrderBookTradesContext } from '@/context/orderBookTradesContext';
import Tooltip from '../ui/Tooltip';
import DirectionSelector from './DirectionSelector';
import { orderTicketTooltips } from './tooltipCopy';
import { useOrderTicketContext } from '@/context/orderTicketContext';
import { derivePairSymbols, getCurrentPositionSize } from '@/utils';

const MarketComponent = () => {
  const { tokenPairs, tokenPairData, assetId, pair } = usePairTokensContext();
  const { hyperliquid, establishedConnection, handleEstablishConnection } =
    useHyperLiquidContext();
  const { webData2 } = useWebDataContext();

  const balance = Number(
    webData2.clearinghouseState?.marginSummary.accountValue
  );

  const [radioValue, setRadioValue] = useState<string>('');
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const { direction, setDirection } = useOrderTicketContext();
  const isBuyOrSell = direction;
  const { base, quote } = derivePairSymbols(tokenPairs, pair);
  const currentPositionSize = getCurrentPositionSize(webData2, base);
  const [selectItem, setSelectItem] = useState(base || `${tokenPairs[0]}`);
  const [takeProfitPrice, setTakeProfitPrice] = useState('');
  const [stopLossPrice, setStopLossPrice] = useState('');
  const [gain, setGain] = useState('');
  const [loss, setLoss] = useState('');
  const [size, setSize] = useState<number>(0.0);
  const [establishConnModal, setEstablishedConnModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [liveMarketPrice, setLiveMarketPrice] = useState<number | null>(null);
  const [livePriceSide, setLivePriceSide] = useState<'bid' | 'ask' | null>(null);

  const currentMarketPrice = tokenPairData[assetId]?.assetCtx.markPx;
  const { bookData, loadingBookData } = useOrderBookTradesContext();
  const isBuy = direction === 'buy';
  let szDecimals = tokenPairData[assetId]?.universe.szDecimals;

  useEffect(() => {
    const updateLivePrice = () => {
      const bestAsk = [...bookData.asks].sort((a, b) => a.px - b.px)[0]?.px;
      const bestBid = [...bookData.bids].sort((a, b) => b.px - a.px)[0]?.px;

      if (isBuy) {
        setLiveMarketPrice(bestAsk ?? null);
        setLivePriceSide('ask');
      } else {
        setLiveMarketPrice(bestBid ?? null);
        setLivePriceSide('bid');
      }
    };

    updateLivePrice();
    const intervalId = setInterval(updateLivePrice, 500);

    return () => clearInterval(intervalId);
  }, [bookData.asks, bookData.bids, isBuy]);

  const handleSizeInput = (e: {
    target: { value: React.SetStateAction<number> };
  }) => {
    const value = e.target.value;
    setSize(value);
  };

  //setting the equivalent size in the selected token
  let TokenSize = getUsdSizeEquivalents({
    size: Number(size),
    currentMarkPrice: Number(currentMarketPrice),
    token: selectItem,
  });

  //maintain the size equivalent state of the  token
  useEffect(() => {
    if (TokenSize) {
      let newSize = Number(TokenSize.toFixed(szDecimals));
      setSize(newSize);
    }
  }, [selectItem]);

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

  const rawReference = Number(
    Number.isFinite(liveMarketPrice) && liveMarketPrice !== null
      ? liveMarketPrice
      : currentMarketPrice
  );
  const priceReference = Number.isFinite(rawReference) ? rawReference : 0;

  //get the size equivalent in USDC
  let sz =
    selectItem.toUpperCase() === 'USDC'
      ? size / (priceReference || 1)
      : size;

  let orderType: OrderType = {
    limit: {
      tif: 'FrontendMarket',
    },
  };
  let reduceOnly = radioValue === '1';

  // Calculate limit price based on buy or sell
  const normalizedReference = priceReference || Number(currentMarketPrice) || 0;

  let normalLimitPx = isBuy
    ? Number(normalizedReference) * 1.03
    : Number(normalizedReference) * 0.97;

  //place order with no Take Profit/Stop Loss
  const handlePlaceOrder = async () => {
    try {
      setIsLoading(true);
      const { success, data, msg } = await hyperliquid.placeOrder({
        a: Number(assetId),
        b: isBuy,
        p: parsePrice(normalLimitPx),
        s: parseSize(sz, szDecimals),
        r: reduceOnly,
        t: orderType,
      });

      if (success) {
        console.log('data', data);
        setIsLoading(false);
        setConfirmModalOpen(false);

        // Check if there's an error in statuses[0]
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
          //Toast error message
          toast.error(
            (
              data.data.statuses[0].error || 'Error ocured please try again'
            ).toString()
          );
        } else {
          //Toast success message if there's no error
          toast.success('Order placed successfully');
        }
      } else {
        console.log('msg', msg);
        setIsLoading(false);

        //Toast error msg
        toast.error((msg || 'Error ocured please try again').toString());
      }
    } catch (error) {
      console.log('error', error);
      setIsLoading(false);
    }
  };

  //place order with Take Profit/Stop Loss
  const placeOrderWithTpSl = async () => {
    try {
      setIsLoading(true);

      //if takeProfitPrice and stopLossPrice are present, validate it against currentMarketPrice
      //if one of the two is present validate each against currentMarketPrice
      if (
        takeProfitPrice.trim() !== '' &&
        Number(takeProfitPrice) < Number(currentMarketPrice) &&
        stopLossPrice.trim() !== '' &&
        Number(stopLossPrice) > Number(currentMarketPrice)
      ) {
        setIsLoading(false);
        setConfirmModalOpen(false);
        return toast.error(
          'TP price should be greater than current market price and SL price should be less than current market price'
        );
      } else if (
        takeProfitPrice.trim() !== '' &&
        Number(takeProfitPrice) < Number(currentMarketPrice)
      ) {
        setIsLoading(false);
        setConfirmModalOpen(false);
        return toast.error(
          'TP price should be greater than current market price'
        );
      } else if (
        stopLossPrice.trim() !== '' &&
        Number(stopLossPrice) > Number(currentMarketPrice)
      ) {
        setIsLoading(false);
        setConfirmModalOpen(false);
        return toast.error('SL price should be less than current market price');
      }

      let tpSlIsBuy = direction !== 'buy'; //tpSl of buy is opposite of normal
      // Calculate tp/sl limit price based on buy or sell
      let tpslLimitPx = tpSlIsBuy
        ? Number(currentMarketPrice) * 1.03
        : Number(currentMarketPrice) * 0.97;

      const { success, data, msg } = await hyperliquid.normalTpSl(
        {
          a: Number(assetId),
          b: isBuy,
          p: parsePrice(normalLimitPx),
          s: parseSize(sz, szDecimals),
          r: reduceOnly,
          t: orderType,
        },
        takeProfitPrice.trim() !== ''
          ? {
              a: Number(assetId),
              b: tpSlIsBuy,
              p: parsePrice(tpslLimitPx),
              s: parseSize(sz, szDecimals),
              r: !reduceOnly,
              t: orderType
              }
          : undefined,
        stopLossPrice.trim() !== ''
          ? {
              a: Number(assetId),
              b: tpSlIsBuy,
              p: parsePrice(tpslLimitPx),
              s: parseSize(sz, szDecimals),
              r: !reduceOnly,
              t: orderType
            }
          : undefined
      );

      if (success) {
        console.log('data', data);
        setIsLoading(false);
        setConfirmModalOpen(false);

        // Check if there's an error in statuses[0]
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
          //Toast error message
          toast.error(
            (
              data.data.statuses[0].error || 'Error ocured please try again'
            ).toString()
          );
        } else {
          //Toast success message if there's no error
          toast.success('Order placed successfully');
        }
      } else {
        console.log('msg', msg);
        setIsLoading(false);

        //Toast error msg
        toast.error((msg || 'Error ocured please try again').toString());
      }
    } catch (error) {
      console.log(error);
    }
  };

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
            <span>Available</span>
          </Tooltip>
          <span>
            {Number(webData2.clearinghouseState?.withdrawable).toFixed(2)}{' '}
            {quote || 'USDC'}
          </span>
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
        <FlexItems>
          <Tooltip content={orderTicketTooltips.currentMarketPrice}>
            <span>Current Market Price</span>
          </Tooltip>
          <span
            style={{
              color:
                livePriceSide === 'bid'
                  ? intelayerColors.green[500]
                  : livePriceSide === 'ask'
                  ? intelayerColors.red[400]
                  : intelayerColors.ink,
            }}
          >
            {liveMarketPrice !== null
              ? `${Number(liveMarketPrice).toFixed(2)} ${quote || 'USDC'}`
              : '--'}
          </span>
        </FlexItems>
      </Box>

      <Box
        sx={{ display: 'flex', flexDirection: 'column', gap: '6px', mt: '6px' }}
      >
        <SelectItemsBox sx={{ m: 0 }}>
          <RenderInput
            label={'Size'}
            tooltip={orderTicketTooltips.size}
            placeholder="|"
            type="number"
            value={size.toString()}
            onChange={(e: any) => handleSizeInput(e)}
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
            selectDataItems={[base || tokenPairs[0] || '—', quote || 'USDC', 'R']}
          />
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
        <FlexItems sx={{ justifyContent: 'flex-start' }}>
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

      {!establishedConnection ? (
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
      ) : (
        <Box sx={{ ...ButtonStyles }}>
          <BuySellBtn
            sx={{
              width: '112px',
              ':disabled': {
                cursor: 'none',
              },
            }}
            className="buyBtn"
            onClick={() => toggleConfirmModal('buy')}
            disabled={size <= 0}
          >
            Buy
          </BuySellBtn>
          <BuySellBtn
            sx={{
              width: '112px',
              ':disabled': {
                cursor: 'none',
              },
            }}
            className="sellBtn"
            onClick={() => toggleConfirmModal('sell')}
            disabled={size <= 0}
          >
            Sell
          </BuySellBtn>
        </Box>
      )}

      {confirmModalOpen && (
        <ConfirmationModal
          onClose={() => setConfirmModalOpen(false)}
          onConfirm={radioValue === '2' ? placeOrderWithTpSl : handlePlaceOrder}
          isMarket={true}
          currentMarketPrice={currentMarketPrice}
          size={`${parseSize(sz, szDecimals)} ${tokenPairs[0]}`}
          isTpSl={radioValue === '2' ? true : false}
          takeProfitPrice={radioValue === '2' ? takeProfitPrice : undefined}
          stopLossPrice={radioValue === '2' ? stopLossPrice : undefined}
          estLiqPrice={''}
          fee={''}
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

export default MarketComponent;
