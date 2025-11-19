export const orderTicketTooltips = {
  availableBalance:
    "Available balance is the amount of free collateral you can use for new positions and margin.",
  currentPositionSize:
    "Current position size shows how much of this asset you are currently long or short in this market.",
  currentMarketPrice:
    "Current Market Price is the latest traded price in this market.",
  size: 'Size is the quantity of the asset you plan to buy or sell in this order.',
  price:
    'Price is the limit price for your order. For market orders this may be disabled or treated as a protection limit.',
  reduceOnly:
    'Reduce Only ensures this order can only decrease or close your existing position, not open a new one.',
  takeProfitStopLoss:
    'Take Profit / Stop Loss lets you attach exit orders that automatically close the position once your target or stop level is reached.',
  addRisk:
    'Add Risk enables advanced risk adjustments, such as adding to an existing position while keeping your max loss under control.',
  enableTrading:
    'Enable trading unlocks order submission for this market after you confirm that you understand the risks.',
} as const;
