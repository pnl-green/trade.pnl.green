export type ExtractedTradeLevels = {
  direction: 'long' | 'short';
  entries: number[];
  stopLoss: number;
  takeProfits: number[];
};

const pricePattern = /\d+(?:\.\d+)?/g;

async function preprocessImage(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}

function heuristicDirection(values: number[]): 'long' | 'short' {
  if (values.length >= 2) {
    return values[1] > values[0] ? 'long' : 'short';
  }
  return 'long';
}

export async function extractTradeLevelsFromImage(
  file: File
): Promise<ExtractedTradeLevels> {
  const dataUrl = await preprocessImage(file);
  // Placeholder OCR: extract numeric tokens from image name/data URL for now
  const matches = (dataUrl.match(pricePattern) || []).map(Number).filter((n) => !Number.isNaN(n));
  const entries = matches.length ? [matches[0]] : [];
  const stopLoss = matches[1] ?? 0;
  const takeProfits = matches.slice(2, 5);
  const direction = heuristicDirection(matches);

  return {
    direction,
    entries,
    stopLoss,
    takeProfits,
  };
}
