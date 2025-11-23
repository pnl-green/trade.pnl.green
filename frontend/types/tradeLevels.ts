export type ParsedLevels = {
  direction: 'LONG' | 'SHORT';
  entry: number | null;
  stop: number | null;
  targets: number[];
};

export type ParsedLevelsResponse = ParsedLevels & {
  confidence?: number;
};

