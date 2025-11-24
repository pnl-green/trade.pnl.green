export type DirectionValue = 'LONG' | 'SHORT';

export type DirectionCandidate = {
  value: DirectionValue;
  confidence: number;
};

export type NumericCandidate = {
  value: number;
  confidence: number;
};

export type ParsedCandidates = {
  directionCandidates: DirectionCandidate[];
  entryCandidates: NumericCandidate[];
  stopCandidates: NumericCandidate[];
  tpCandidates: NumericCandidate[];
};

export type DirectionalRanking = {
  direction: DirectionValue;
  entryCandidates: NumericCandidate[];
  stopCandidates: NumericCandidate[];
  tpCandidates: NumericCandidate[];
};

export type ParseResponse = {
  modelUsed: 'gpt-4.1' | 'gpt-4.1-mini';
  candidates: ParsedCandidates;
  directionalRankings: DirectionalRanking[];
  noiseScore?: number;
};

