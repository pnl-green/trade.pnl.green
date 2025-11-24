export type DirectionValue = 'LONG' | 'SHORT';

/*
 * TODO: Re-enable advanced multi-candidate parsing once heuristics are stable.
 * type DirectionCandidate = { ... }
 * type NumericCandidate = { ... }
 * type ParsedCandidates = { ... }
 * type DirectionalRanking = { ... }
 */

export type SimpleParseResponse = {
  success: boolean;
  direction?: DirectionValue;
  entry?: number;
  stop?: number;
  tp?: number;
  modelUsed?: 'gpt-4o';
  error?: string;
};

export type ParseResponse = SimpleParseResponse;

