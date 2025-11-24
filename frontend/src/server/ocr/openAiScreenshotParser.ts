/**
 * TODO: Re-enable heuristics (noise detection, multi-candidate ranking) once parsing is stable.
 * The previous implementation included noise analysis, model routing, and candidate scoring.
 */

import type { DirectionValue } from '@/types/tradeLevels';
import {
  ScreenshotParseCodes,
  type ScreenshotParseLogEntry,
  type ParsedLevelsPartial,
  type ScreenshotParseCode,
} from '@/types/screenshotParsing';

type RawOpenAiResponse = {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type: string; text?: string }>;
    };
  }>;
};

type NoiseBand = 'low' | 'medium' | 'high';
type VisionModel = 'gpt-4o' | 'gpt-4o-mini';

class ScreenshotParserError extends Error {
  code: ScreenshotParseCode;

  constructor(code: ScreenshotParseCode, message: string) {
    super(message);
    this.code = code;
  }
}

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

function sanitizeConfidence(value: unknown): number | null {
  const numeric = sanitizeNumber(value);
  if (numeric == null) return null;
  if (numeric < 0 || numeric > 1) return null;
  return numeric;
}

async function callOpenAI(
  encoded: string,
  apiKey: string,
  pushLog?: (entry: Omit<ScreenshotParseLogEntry, 'timestamp'>) => void
): Promise<ParsedLevelsPartial> {
  pushLog?.({
    level: 'info',
    phase: 'server-model-call',
    code: ScreenshotParseCodes.OPENAI_REQUEST_READY,
    message: 'Prepared OpenAI vision request',
    details: { model: 'gpt-4o', imageSizeBytes: encoded.length / 1.37 },
  });

  let response: Response;
  try {
    response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You are an assistant that extracts a crypto trade plan from a TradingView screenshot.\n\nThe screenshot may contain:\n- A long or short setup (green/red rectangle)\n- Entry, stop loss, and take profit levels\n- Price ladder on the right\n- Additional noise (indicators, lines, etc.)\n\nYour job is to extract the trade direction and price levels.\n\nIMPORTANT RULES:\n\n1. ALWAYS respond with a SINGLE JSON object. No prose, no explanation, no markdown.\n2. Use exactly this schema:\n\n{\n  "direction": "LONG" | "SHORT" | null,\n  "entry": number | null,\n  "stop": number | null,\n  "tp": number | null,\n  "confidence": number | null\n}\n\n3. If you are uncertain about a field, set it to null but still fill what you can.\n4. "direction" should be:\n   - "LONG" if the trade is a long/buy setup\n   - "SHORT" if the trade is a short/sell setup\n   - null if you truly cannot tell\n5. "entry", "stop", and "tp" should be numeric prices (e.g., 2786.2), not strings.\n6. "confidence" should be a number between 0 and 1 representing your overall confidence in the extracted levels, or null if you cannot estimate it.\n\nReturn ONLY the JSON. Do NOT include any text before or after it.',
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Identify the trade plan and respond with strict JSON in the required schema.',
              },
              { type: 'image_url', image_url: { url: `data:image/png;base64,${encoded}` } },
            ],
          },
        ],
      }),
    });
  } catch (error) {
    pushLog?.({
      level: 'error',
      phase: 'server-model-call',
      code: ScreenshotParseCodes.OPENAI_ERROR,
      message: 'Failed to reach OpenAI',
      details: { message: (error as Error)?.message },
    });
    throw new ScreenshotParserError(
      ScreenshotParseCodes.OPENAI_ERROR,
      (error as Error)?.message || 'Failed to reach OpenAI'
    );
  }

  if (!response.ok) {
    const errorPayload = await response.text();
    pushLog?.({
      level: 'error',
      phase: 'server-model-call',
      code: ScreenshotParseCodes.OPENAI_ERROR,
      message: 'OpenAI returned a non-200 response',
      details: { status: response.status, statusText: response.statusText },
    });
    throw new ScreenshotParserError(
      ScreenshotParseCodes.OPENAI_ERROR,
      `OpenAI request failed (${response.status} ${response.statusText}): ${errorPayload}`
    );
  }

  const json = (await response.json()) as RawOpenAiResponse;
  pushLog?.({
    level: 'info',
    phase: 'server-model-call',
    code: ScreenshotParseCodes.OPENAI_RESPONSE_OK,
    message: 'OpenAI responded successfully',
    details: { status: response.status },
  });

  const content = pickContent(json);
  if (!content) {
    pushLog?.({
      level: 'warn',
      phase: 'server-parse-response',
      code: ScreenshotParseCodes.JSON_EMPTY,
      message: 'OpenAI returned empty content',
    });
    throw new ScreenshotParserError(
      ScreenshotParseCodes.JSON_EMPTY,
      'OpenAI returned an empty response.'
    );
  }

  let parsed: any;
  try {
    const trimmedContent = content.trim();
    parsed = JSON.parse(trimmedContent);
    pushLog?.({
      level: 'info',
      phase: 'server-parse-response',
      code: ScreenshotParseCodes.JSON_PARSE_OK,
      message: 'Parsed JSON from OpenAI response',
    });
  } catch (error) {
    pushLog?.({
      level: 'error',
      phase: 'server-parse-response',
      code: ScreenshotParseCodes.JSON_PARSE_ERROR,
      message: 'Failed to parse JSON from OpenAI',
      details: { snippet: content.slice(0, 200), length: content.length },
    });
    throw new ScreenshotParserError(
      ScreenshotParseCodes.JSON_PARSE_ERROR,
      'OpenAI response was not valid JSON.'
    );
  }

  const direction: DirectionValue | null =
    parsed.direction === 'SHORT' ? 'SHORT' : parsed.direction === 'LONG' ? 'LONG' : null;

  return {
    direction,
    entry: sanitizeNumber(parsed.entry),
    stop: sanitizeNumber(parsed.stop),
    tp: sanitizeNumber(parsed.tp),
    confidence: sanitizeConfidence(parsed.confidence),
  };
}

export async function parseScreenshotWithOpenAI(
  buffer: Buffer,
  pushLog?: (entry: Omit<ScreenshotParseLogEntry, 'timestamp'>) => void
): Promise<ParsedLevelsPartial> {
  const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing OpenAI API key. Set OPENAI_API_KEY in the environment.');
  }

  if (!buffer?.length) {
    throw new Error('Empty screenshot buffer.');
  }

  pushLog?.({
    level: 'info',
    phase: 'server-model-call',
    code: ScreenshotParseCodes.OPENAI_REQUEST_READY,
    message: 'Encoding screenshot for OpenAI request',
    details: { sizeBytes: buffer.length },
  });

  const encoded = buffer.toString('base64');
  const result = await callOpenAI(encoded, apiKey, pushLog);

  return result;
}

