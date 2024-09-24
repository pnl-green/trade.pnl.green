// Datafeed implementation
import Datafeed from './datafeed.js';

window.tvWidget = new TradingView.widget({
  symbol: 'Hyperliquid:BTC/ETH',
  interval: '1H',
  fullscreen: true,
  container: 'tv_chart_container',
  datafeed: Datafeed,
  library_path: '../charting_library/charting_library/',
});
