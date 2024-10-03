import { parseFullSymbol } from './helpers';

const socket = new WebSocket(
  'ws://127.0.0.1:8081'
);
const channelToSubscription = new Map();

socket.addEventListener('open', () => {
  console.log('[socket] Connected');
});

socket.addEventListener('close', (reason) => {
  console.log('[socket] Disconnected:', reason);
});

socket.addEventListener('error', (error) => {
  console.log('[socket] Error:', error);
});

socket.addEventListener('message', (event) => {
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
    n: number
  } = data;

  const tradePrice = open; // TODO
  const tradeTime = start;

  const subscriptionItem = channelToSubscription.get(symbol);
  if (subscriptionItem === undefined) {
    console.log("Undefined")
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

  socket.send(`
  {
    "method": "pairs_candle",
    "data": {
        "symbol_left": "${parsedSymbol.fromSymbol}",
        "symbol_right": "${parsedSymbol.toSymbol}"
    }
  }`);
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
        const subRequest = {
          action: 'SubRemove',
          subs: [channelString],
        };
        // socket.send(JSON.stringify(subRequest));
        channelToSubscription.delete(channelString);
        break;
      }
    }
  }
}
