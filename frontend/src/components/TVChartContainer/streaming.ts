import { parseFullSymbol } from './helpers';

const channelToSubscription = new Map<string, any>();
const pollingIntervals = new Map<string, NodeJS.Timeout>();

const socketUrl =
  process.env.NEXT_PUBLIC_WS_URL || 'wss://api.hyperliquid.xyz/ws';

let socket: WebSocket | null = null;
const sendMessage = (payload: string) => {
  if (!socket) {
    console.error('Chart WebSocket unavailable; skipping message.');
    return;
  }

  if (socket.readyState === WebSocket.OPEN) {
    socket.send(payload);
  } else {
    socket.addEventListener(
      'open',
      () => socket?.send(payload),
      { once: true }
    );
  }
};

if (typeof window !== 'undefined') {
  if (!socketUrl) {
    console.error('Missing NEXT_PUBLIC_WS_URL – chart streaming disabled');
  } else {
    try {
      socket = new WebSocket(socketUrl);
    } catch (error) {
      console.error('Failed to initialize chart WebSocket:', error);
    }
  }
}

socket?.addEventListener('open', () => {
  console.log('[socket] Connected');
});

socket?.addEventListener('close', (reason) => {
  console.log('[socket] Disconnected:', reason);
});

socket?.addEventListener('error', (error) => {
  console.log('[socket] Error:', error);
});

socket?.addEventListener('message', (event) => {
  const data = JSON.parse(event.data);
  console.log('[socket] Message:', data);
  const {
    t: start,
    T: end,
    s: symbol,
    i: interval,
    o: open,
    c: close,
    h: high,
    l: low,
    v: volume,
    n: number,
  } = data;

  const tradePrice = open; // TODO
  const tradeTime = start;

  const subscriptionItem = channelToSubscription.get(symbol);
  if (subscriptionItem === undefined) {
    console.log('Undefined');
    return;
  }
  const lastDailyBar = subscriptionItem.lastDailyBar;
  const nextDailyBarTime = getNextDailyBarTime(lastDailyBar.time);

  let bar;
  if (tradeTime >= nextDailyBarTime) {
    bar = {
      time: nextDailyBarTime,
      open: tradePrice,
      high: tradePrice,
      low: tradePrice,
      close: tradePrice,
    };
    console.log('[socket] Generate new bar', bar);
  } else {
    bar = {
      ...lastDailyBar,
      high: Math.max(lastDailyBar.high, tradePrice),
      low: Math.min(lastDailyBar.low, tradePrice),
      close: tradePrice,
    };
    console.log('[socket] Update the latest bar by price', tradePrice);
  }
  subscriptionItem.lastDailyBar = bar;

  // Send data to every subscriber of that symbol
  subscriptionItem.handlers.forEach((handler: any) => handler.callback(bar));
});

function getNextDailyBarTime(barTime: any) {
  const date = new Date(barTime * 1000);
  date.setDate(date.getDate() + 1);
  return date.getTime() / 1000;
}

export function subscribeOnStream(
  symbolInfo: any,
  resolution: any,
  onRealtimeCallback: any,
  subscriberUID: any,
  onResetCacheNeededCallback: any,
  lastDailyBar: any
) {
  const parsedSymbol: any = parseFullSymbol(symbolInfo.full_name);
  const channelString = `${parsedSymbol.fromSymbol}/${parsedSymbol.toSymbol}`;

  const handler = {
    id: subscriberUID,
    callback: onRealtimeCallback,
  };
  let subscriptionItem = channelToSubscription.get(channelString);
  if (subscriptionItem) {
    // Already subscribed to the channel, use the existing subscription
    subscriptionItem.handlers.push(handler);
    return;
  }
  subscriptionItem = {
    subscriberUID,
    resolution,
    lastDailyBar,
    handlers: [handler],
  };
  channelToSubscription.set(channelString, subscriptionItem);

  if (parsedSymbol.exchange === 'Hyperliquid') {
    sendMessage(`
    {
      "method": "pairs_candle",
      "data": {
          "symbol_left": "${parsedSymbol.fromSymbol}",
          "symbol_right": "${parsedSymbol.toSymbol}"
      }
    }`);
  } else {
    // Polling for non-Hyperliquid exchanges
    // Fetch immediately
    fetchLatestCandle(parsedSymbol, resolution, onRealtimeCallback, channelString);

    // Set up interval
    const intervalId = setInterval(() => {
      fetchLatestCandle(parsedSymbol, resolution, onRealtimeCallback, channelString);
    }, 5000); // Poll every 5 seconds

    pollingIntervals.set(channelString, intervalId);
  }
}

async function fetchLatestCandle(
  parsedSymbol: any,
  resolution: string,
  onRealtimeCallback: any,
  channelString: string
) {
  try {
    const resolutionMap = (res: string) => {
      const normalized = res.toString().toUpperCase();
      if (normalized.endsWith('H')) return `${normalized.replace('H', '')}h`;
      if (normalized.endsWith('D')) return `${normalized.replace('D', '')}d`;
      if (normalized.endsWith('W')) return `${normalized.replace('W', '')}w`;
      if (normalized.endsWith('M')) return `${normalized.replace('M', '')}M`;
      return '1m';
    };

    const logicalSymbol = `${parsedSymbol.fromSymbol}-${parsedSymbol.toSymbol}`;
    const params = new URLSearchParams({
      symbol: logicalSymbol,
      tf: resolutionMap(resolution),
      limit: '1',
    });

    const url = `/ccxt/${parsedSymbol.exchange.toLowerCase()}/candles?${params.toString()}`;
    const rawResponse = await fetch(url);
    
    if (!rawResponse.ok) {
      console.error(`[polling] Failed to fetch candle: ${rawResponse.status} ${rawResponse.statusText}`);
      return;
    }
    
    const response = await rawResponse.json();

    if (response.success && response.data && response.data.length > 0) {
      const barData = response.data[response.data.length - 1]; // Get latest candle
      // Check if it's the array format [time, open, high, low, close, volume]
      let bar;
      if (Array.isArray(barData)) {
        bar = {
          time: Number(barData[0]),
          open: Number(barData[1]),
          high: Number(barData[2]),
          low: Number(barData[3]),
          close: Number(barData[4]),
          volume: Number(barData[5] ?? 0),
        };
      } else {
        bar = {
          time: Number(barData.time),
          open: Number(barData.open),
          high: Number(barData.high),
          low: Number(barData.low),
          close: Number(barData.close),
          volume: Number(barData.volume ?? 0),
        };
      }

      onRealtimeCallback(bar);
    } else if (!response.success && response.error) {
      console.error(`[polling] CCXT API error for ${channelString}:`, response.error);
    }
  } catch (err) {
    console.error(`[polling] Failed to fetch candle for ${channelString}`, err);
  }
}

export function unsubscribeFromStream(subscriberUID: string) {
  // TODO
  // Find a subscription with id === subscriberUID
  for (const channelString of channelToSubscription.keys()) {
    const subscriptionItem = channelToSubscription.get(channelString);
    const handlerIndex = subscriptionItem.handlers.findIndex(
      (handler: any) => handler.id === subscriberUID
    );

    if (handlerIndex !== -1) {
      // Remove from handlers
      subscriptionItem.handlers.splice(handlerIndex, 1);

      if (subscriptionItem.handlers.length === 0) {
        // Unsubscribe from the channel if it was the last handler
        console.log(
          '[unsubscribeBars]: Unsubscribe from streaming. Channel:',
          channelString
        );

        // Clear polling interval if exists
        if (pollingIntervals.has(channelString)) {
          clearInterval(pollingIntervals.get(channelString));
          pollingIntervals.delete(channelString);
        } else {
          // Only send WS unsubscribe if we were using WS (though for now we just drop the handler locally for WS, 
          // as the original code didn't seem to have a robust unsubscribe message implemented deeply)
          const subRequest = {
            action: 'SubRemove',
            subs: [channelString],
          };
          // socket.send(JSON.stringify(subRequest));
        }

        channelToSubscription.delete(channelString);
        break;
      }
    }
  }
}
