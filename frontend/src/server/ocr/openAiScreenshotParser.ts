/**
 * TODO: Re-enable heuristics (noise detection, multi-candidate ranking) once parsing is stable.
 * The previous implementation included noise analysis, model routing, and candidate scoring.
 */

import type { DirectionValue, ParseResponse } from '@/types/tradeLevels';

type RawOpenAiResponse = {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type: string; text?: string }>;
    };
  }>;
};

type NoiseBand = 'low' | 'medium' | 'high';
type VisionModel = 'gpt-4o' | 'gpt-4o-mini';

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

async function callOpenAI(
  encoded: string,
  apiKey: string
): Promise<{ direction?: DirectionValue; entry?: number; stop?: number; tp?: number; error?: string }> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
            'You are a precise trading assistant. Extract direction (LONG/SHORT), entry price, stop loss, and primary take profit from TradingView screenshots. Reply ONLY with JSON matching {"success":true,"direction":"LONG","entry":1234.56,"stop":1230.1,"tp":1248.9}. Use null when uncertain.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Identify the trade plan and respond with success flag plus direction, entry, stop, and take profit.',
            },
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

  let parsed: any;
  try {
    parsed = JSON.parse(content);
  } catch (error) {
    throw new Error('OpenAI response was not valid JSON.');
  }

  return {
    direction:
      parsed.direction === 'SHORT' ? 'SHORT' : parsed.direction === 'LONG' ? 'LONG' : undefined,
    entry: sanitizeNumber(parsed.entry) ?? undefined,
    stop: sanitizeNumber(parsed.stop) ?? undefined,
    tp: sanitizeNumber(parsed.tp) ?? undefined,
    error: typeof parsed.error === 'string' ? parsed.error : undefined,
  };
}

export async function parseScreenshotWithOpenAI(buffer: Buffer): Promise<ParseResponse> {
  const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing OpenAI API key. Set OPENAI_API_KEY in the environment.');
  }

  if (!buffer?.length) {
    throw new Error('Empty screenshot buffer.');
  }

  const encoded = buffer.toString('base64');
  const result = await callOpenAI(encoded, apiKey);

  return {
    success: Boolean(result.direction && result.entry != null && result.stop != null && result.tp != null),
    direction: result.direction,
    entry: result.entry,
    stop: result.stop,
    tp: result.tp,
    modelUsed: 'gpt-4o',
    error: result.error,
  };
}

