export interface tokenPairs {
  token1: string;
  token2: string;
}

export interface PairData {
  id?: any;
  symbol?: string | any;
  label?: string | any;
  markPrice?: number | any;
  oraclePrice?: number | any;
  lastPrice?: number | any;
  hr24change?: string | any;
  changeIncrease?: boolean;
  volume?: number | any;
  openInterest?: number | any;
  countDown?: string | any;
  funding?: string | any;
}
