import {
  PnlWrapper,
  TradingViewComponent,
  WalletBox,
} from '@/styles/pnl.styles';
import React, { memo, useMemo } from 'react';
import { Box } from '@mui/material';
import OrderPlacement from './order-placement-terminal';
import { FlexItems } from '@/styles/common.styles';
import PositionsOrdersHistory from './positions-history-components';
import ChatComponent from './chatComponent';
import OrderBookAndTrades from './order-book-and-trades';
import TokenPairInformation from './token-pair-information';
import { usePairTokensContext } from '@/context/pairTokensContext';
import { useWebDataContext } from '@/context/webDataContext';
import dynamic from "next/dynamic";
import {
  ChartingLibraryWidgetOptions,
  ResolutionString,
} from "@/public/static/charting_library";

const TVChartContainer = dynamic(
  () =>
    import("@/components/TVChartContainer").then((mod) => mod.TVChartContainer),
  { ssr: false }
);
//------Memoized Component to ------
const AdvancedChartMemoized = memo(function AdvancedChartMemoized(props: any) {
  return (
    <TradingViewComponent>
      <TVChartContainer {...props} />
    </TradingViewComponent>
  );
});

const PnlComponent = () => {
  //------Context------
  const { webData2 } = useWebDataContext();
  const { tokenPairs } = usePairTokensContext();

  const balance = webData2.clearinghouseState?.marginSummary.accountValue;

  const renderAdvancedChart = tokenPairs.length > 1; //render chart only when token pairs are selected

  const defaultWidgetProps: Partial<ChartingLibraryWidgetOptions> = {
    interval: "1H" as ResolutionString,
    library_path: "/static/charting_library/charting_library/",
    locale: "en",
    fullscreen: false,
    autosize: true,
    theme: "dark",
    symbol: tokenPairs ? `Hyperliquid:${tokenPairs[0]}/${tokenPairs[1]}` : '',
  };

  return (
    <PnlWrapper>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <TokenPairInformation />

        {useMemo(
          () =>
            renderAdvancedChart ? (
              <AdvancedChartMemoized {...defaultWidgetProps} />
            ) : null,
          [renderAdvancedChart, tokenPairs]
        )}

        <PositionsOrdersHistory />
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <OrderBookAndTrades />
        <ChatComponent />
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: '5px',
          '@media (max-width: 1535px)': {
            flexDirection: 'row',
            flexWrap: 'wrap',
          },
          '@media (max-width: 899px)': {
            flexDirection: 'column',
            flexWrap: 'nowrap',
          },
        }}
      >
        <OrderPlacement />

        <WalletBox sx={{ span: { fontSize: '15px' } }} id="wallet-component">
          <FlexItems>
            <span>Balance</span>
            <span>{balance ? `$${Number(balance).toFixed(2)}` : '$0.00'}</span>
          </FlexItems>
          <FlexItems>
            <span>uPNL</span>
            <span>$0.00</span>
          </FlexItems>
          <FlexItems>
            <span>Equity</span>
            <span>$0.00</span>
          </FlexItems>
          <FlexItems>
            <span>Cross Margin Ratio</span>
            <span className="green">$0.00</span>
          </FlexItems>
          <FlexItems>
            <span>Maintenance Margin</span>
            <span>$0.00</span>
          </FlexItems>
          <FlexItems>
            <span>Cross Account Leverage</span>
            <span>$0.00</span>
          </FlexItems>
        </WalletBox>
      </Box>
    </PnlWrapper>
  );
};

export default PnlComponent;
