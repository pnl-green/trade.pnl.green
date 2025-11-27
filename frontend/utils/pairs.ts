export const derivePairSymbols = (
  tokenPairs: string[] = [],
  pair?: string
) => {
  const [pairBase, pairQuote] = (pair || '').split('-');
  const base = tokenPairs[0] || pairBase || '';
  const quote = tokenPairs[1] || pairQuote || '';
  const normalizedQuote = normalizeQuote(quote);

  return { base, quote: normalizedQuote };
};

const normalizeQuote = (quote?: string) => {
  const upperQuote = (quote || '').toUpperCase();

  if (upperQuote === 'USDCC' || upperQuote === 'USD') {
    return 'USDC';
  }

  return upperQuote;
};

export const getCurrentPositionSize = (webData2: any, base: string) => {
  const positions = webData2?.clearinghouseState?.assetPositions || [];
  const match = positions.find(
    (position: any) =>
      position?.position?.coin?.toUpperCase() === base?.toUpperCase()
  );

  const rawSize = Number(match?.position?.szi ?? 0);
  return Number.isFinite(rawSize) ? rawSize : 0;
};
