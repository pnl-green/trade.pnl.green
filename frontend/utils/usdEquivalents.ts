// To calculate the USD equivalent of a given size of a token pair
export const getUsdSizeEquivalents = ({
  size,
  currentMarkPrice,
  token,
}: {
  size: number;
  currentMarkPrice: number;
  token: string;
}) => {
  if (token.toUpperCase() === 'USD') {
    return size * currentMarkPrice;
  }else{
    return size/currentMarkPrice;
  }
};
