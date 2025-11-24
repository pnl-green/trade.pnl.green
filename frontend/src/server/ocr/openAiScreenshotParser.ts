import Jimp from 'jimp';
import type {
  DirectionCandidate,
  DirectionalRanking,
  DirectionValue,
  NumericCandidate,
  ParseResponse,
  ParsedCandidates,
} from '@/types/tradeLevels';

type RawOpenAiResponse = {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type: string; text?: string }>;
    };
  }>;
};

type NoiseBand = 'low' | 'medium' | 'high';
type VisionModel = 'gpt-4o' | 'gpt-4o-mini';

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

function pickContent(response: RawOpenAiResponse): string | null {
  const raw = response?.choices?.[0]?.message?.content;
  if (!raw) return null;
  if (typeof raw === 'string') return raw;
  const textChunk = raw.find((chunk) => chunk.type === 'text');
  return textChunk?.text ?? null;
}

function sanitizeNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[^0-9.+-]/g, ''));
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function ensureCandidates<T extends { confidence: number }>(candidates: T[]): T[] {
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return [{ ...(candidates?.[0] ?? {}), confidence: 0.4 } as T];
  }
  return candidates.map((candidate, index) => ({
    ...candidate,
    confidence: Number.isFinite(candidate.confidence)
      ? clamp(candidate.confidence, 0, 1)
      : clamp(1 - index * 0.1, 0, 1),
  }));
}

function ensureNumericCandidates(list: NumericCandidate[], fallbackValue: number): NumericCandidate[] {
  const cleaned = ensureCandidates(list).map((candidate, index) => ({
    value: sanitizeNumber(candidate.value) ?? fallbackValue,
    confidence: Number.isFinite(candidate.confidence)
      ? clamp(candidate.confidence, 0, 1)
      : clamp(1 - index * 0.1, 0, 1),
  }));
  if (!cleaned.length) {
    return [{ value: fallbackValue, confidence: 0.4 }];
  }
  return cleaned;
}

async function analyzeNoise(buffer: Buffer): Promise<{ noiseScore: number; band: NoiseBand }> {
  const image = await Jimp.read(buffer);
  const { width } = image.bitmap;
  const sampled = image.clone().resize(Math.max(64, Math.floor(width / 8)), Jimp.AUTO);

  let edgeSum = 0;
  let transitions = 0;
  let colorBuckets = new Map<string, number>();

  sampled.scan(0, 0, sampled.bitmap.width, sampled.bitmap.height, function (x, y, idx) {
    const thisR = this.bitmap.data[idx];
    const thisG = this.bitmap.data[idx + 1];
    const thisB = this.bitmap.data[idx + 2];

    const key = `${Math.round(thisR / 32)}-${Math.round(thisG / 32)}-${Math.round(thisB / 32)}`;
    colorBuckets.set(key, (colorBuckets.get(key) ?? 0) + 1);

    const rightIdx = idx + 4;
    if (x + 1 < this.bitmap.width) {
      const diff =
        Math.abs(thisR - this.bitmap.data[rightIdx]) +
        Math.abs(thisG - this.bitmap.data[rightIdx + 1]) +
        Math.abs(thisB - this.bitmap.data[rightIdx + 2]);
      edgeSum += diff;
      if (diff > 80) transitions += 1;
    }
    const bottomIdx = idx + this.bitmap.width * 4;
    if (y + 1 < this.bitmap.height) {
      const diff =
        Math.abs(thisR - this.bitmap.data[bottomIdx]) +
        Math.abs(thisG - this.bitmap.data[bottomIdx + 1]) +
        Math.abs(thisB - this.bitmap.data[bottomIdx + 2]);
      edgeSum += diff;
      if (diff > 80) transitions += 1;
    }
  });

  const pixels = sampled.bitmap.width * sampled.bitmap.height;
  const edgeDensity = edgeSum / (pixels * 255 * 3);
  const transitionRatio = transitions / pixels;
  const paletteSize = colorBuckets.size;
  const paletteScore = clamp(paletteSize / 64, 0, 1);

  const noiseScore = clamp(edgeDensity * 0.4 + transitionRatio * 0.4 + paletteScore * 0.2, 0, 1);
  const band: NoiseBand = noiseScore < 0.3 ? 'low' : noiseScore < 0.65 ? 'medium' : 'high';
  return { noiseScore, band };
}

async function requestClutterRating(encodedThumb: string, apiKey: string): Promise<number | null> {
async function requestClutterRating(encodedThumb: string, apiKey: string): Promise<number | null> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        max_tokens: 10,
        messages: [
          {
            role: 'system',
            content:
              'Rate the chart clutter from 1 (clean) to 3 (busy). Respond with only the number.',
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Clutter rating 1-3?' },
              { type: 'image_url', image_url: { url: `data:image/png;base64,${encodedThumb}` } },
            ],
          },
        ],
      }),
    });
    const json = (await response.json()) as RawOpenAiResponse;
    const text = pickContent(json);
    if (!text) return null;
    const rating = Number(text.trim());
    return Number.isFinite(rating) ? clamp(rating, 1, 3) : null;
  } catch (error) {
    console.warn('Clutter rating failed', error);
    return null;
  }
}

function chooseModel(noiseBand: NoiseBand, clutterRating?: number | null): VisionModel {
  if (noiseBand === 'high') return 'gpt-4o';
  if (noiseBand === 'low') return 'gpt-4o-mini';
  if (clutterRating != null) {
    return clutterRating >= 3 ? 'gpt-4o' : 'gpt-4o-mini';
  }
  return 'gpt-4o';
}

type RawParsedPayload = {
  directionCandidates?: DirectionCandidate[];
  entryCandidates?: NumericCandidate[];
  stopCandidates?: NumericCandidate[];
  tpCandidates?: NumericCandidate[];
};

function normalizeCandidates(payload: RawParsedPayload): ParsedCandidates {
  const directions = ensureCandidates(
    (payload.directionCandidates || [{ value: 'LONG', confidence: 0.5 }]) as DirectionCandidate[]
  ).map((candidate) => ({
    value: candidate.value === 'SHORT' ? 'SHORT' : 'LONG',
    confidence: candidate.confidence,
  }));

  const entryCandidates = ensureNumericCandidates(payload.entryCandidates || [], 0);
  const stopCandidates = ensureNumericCandidates(payload.stopCandidates || [], 0);
  const tpCandidates = ensureNumericCandidates(payload.tpCandidates || [], 0);

  return {
    directionCandidates: directions,
    entryCandidates,
    stopCandidates,
    tpCandidates,
  };
}

function scoreCandidate(
  candidate: NumericCandidate,
  direction: DirectionValue,
  entryRef: number,
  stopRef: number,
  tpRef: number,
  field: 'entry' | 'stop' | 'tp'
): number {
  let score = candidate.confidence;
  if (direction === 'LONG') {
    if (field === 'entry') {
      if (candidate.value <= stopRef) score -= 0.3;
      if (candidate.value >= tpRef) score -= 0.15;
    }
    if (field === 'stop') {
      if (candidate.value >= entryRef) score -= 0.4;
    }
    if (field === 'tp') {
      if (candidate.value <= entryRef) score -= 0.35;
    }
  } else {
    if (field === 'entry') {
      if (candidate.value >= stopRef) score -= 0.3;
      if (candidate.value <= tpRef) score -= 0.15;
    }
    if (field === 'stop') {
      if (candidate.value <= entryRef) score -= 0.4;
    }
    if (field === 'tp') {
      if (candidate.value >= entryRef) score -= 0.35;
    }
  }
  return score;
}

function rerankForDirection(candidates: ParsedCandidates, direction: DirectionValue): DirectionalRanking {
  const entryRef = candidates.entryCandidates[0]?.value ?? 0;
  const stopRef = candidates.stopCandidates[0]?.value ?? 0;
  const tpRef = candidates.tpCandidates[0]?.value ?? 0;

  const entryCandidates = [...candidates.entryCandidates]
    .map((candidate) => ({ ...candidate, confidence: clamp(candidate.confidence, 0, 1) }))
    .sort((a, b) =>
      scoreCandidate(b, direction, entryRef, stopRef, tpRef, 'entry') -
      scoreCandidate(a, direction, entryRef, stopRef, tpRef, 'entry')
    );

  const stopCandidates = [...candidates.stopCandidates]
    .map((candidate) => ({ ...candidate, confidence: clamp(candidate.confidence, 0, 1) }))
    .sort((a, b) =>
      scoreCandidate(b, direction, entryRef, stopRef, tpRef, 'stop') -
      scoreCandidate(a, direction, entryRef, stopRef, tpRef, 'stop')
    );

  const tpCandidates = [...candidates.tpCandidates]
    .map((candidate) => ({ ...candidate, confidence: clamp(candidate.confidence, 0, 1) }))
    .sort((a, b) =>
      scoreCandidate(b, direction, entryRef, stopRef, tpRef, 'tp') -
      scoreCandidate(a, direction, entryRef, stopRef, tpRef, 'tp')
    );

  return { direction, entryCandidates, stopCandidates, tpCandidates };
}

function isLowConfidence(candidates: ParsedCandidates): boolean {
  const topDir = candidates.directionCandidates[0];
  const topEntry = candidates.entryCandidates[0];
  const topStop = candidates.stopCandidates[0];
  const topTp = candidates.tpCandidates[0];
  return [topDir, topEntry, topStop, topTp].some((c) => !c) || (topDir?.confidence ?? 0) < 0.45;
}

async function callOpenAI(model: VisionModel, encoded: string, apiKey: string): Promise<ParsedCandidates> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You extract trade plans from TradingView screenshots. Return ranked candidates per field. Output ONLY JSON matching {"directionCandidates":[{"value":"LONG"|"SHORT","confidence":0-1}],"entryCandidates":[{"value":number,"confidence":0-1}],"stopCandidates":[{"value":number,"confidence":0-1}],"tpCandidates":[{"value":number,"confidence":0-1}]}. Provide 3-5 numeric candidates when plausible.',
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Parse direction, entry, stop loss, and take profit targets with ranked alternatives.' },
            { type: 'image_url', image_url: { url: `data:image/png;base64,${encoded}` } },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorPayload = await response.text();
    throw new Error(
      `OpenAI request failed (${response.status} ${response.statusText}): ${errorPayload}`
    );
  }

  const json = (await response.json()) as RawOpenAiResponse;
  const content = pickContent(json);
  if (!content) {
    throw new Error('OpenAI returned an empty response.');
  }

  let parsed: RawParsedPayload;
  try {
    parsed = JSON.parse(content);
  } catch (error) {
    throw new Error('OpenAI response was not valid JSON.');
  }

  return normalizeCandidates(parsed);
}

export async function parseScreenshotWithOpenAI(buffer: Buffer): Promise<ParseResponse> {
  const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing OpenAI API key. Set OPENAI_API_KEY in the environment.');
  }

  if (!buffer?.length) {
    throw new Error('Empty screenshot buffer.');
  }

  const { noiseScore, band } = await analyzeNoise(buffer);
  const thumbnail = await (await Jimp.read(buffer)).resize(96, Jimp.AUTO).getBase64Async(Jimp.MIME_PNG);
  const clutterRating = band === 'medium' ? await requestClutterRating(thumbnail.split(',')[1], apiKey) : null;
  const initialModel = chooseModel(band, clutterRating);

  const encoded = buffer.toString('base64');
  let modelUsed: VisionModel = initialModel;
  let candidates = await callOpenAI(initialModel, encoded, apiKey);

  if (initialModel === 'gpt-4o-mini' && isLowConfidence(candidates)) {
    modelUsed = 'gpt-4o';
    candidates = await callOpenAI('gpt-4o', encoded, apiKey);
  }

  const directionalRankings: DirectionalRanking[] = [
    rerankForDirection(candidates, 'LONG'),
    rerankForDirection(candidates, 'SHORT'),
  ];

  return {
    success: true,
    modelUsed,
    candidates,
    directionalRankings,
    noiseScore,
  };
}

