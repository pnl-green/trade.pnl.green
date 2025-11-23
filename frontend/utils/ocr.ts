import { getParsedLevels, type ParsedLevels } from './parseTradingViewScreenshot';

export type ExtractedTradeLevels = {
  direction: 'long' | 'short';
  entries: number[];
  stopLoss: number | null;
  takeProfits: number[];
};

function normalizeLevels(parsed: ParsedLevels): ExtractedTradeLevels {
  const direction = parsed.direction === 'SHORT' ? 'short' : 'long';
  const entries = parsed.entry !== null ? [parsed.entry] : [];
  return {
    direction,
    entries,
    stopLoss: parsed.stop ?? null,
    takeProfits: parsed.targets,
  };
}

export async function extractTradeLevelsFromImage(file: File): Promise<ExtractedTradeLevels> {
  const parsed = await getParsedLevels(file);
  return normalizeLevels(parsed);
}
