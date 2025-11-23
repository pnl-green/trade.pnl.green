import type { ParsedLevels } from '@/types/tradeLevels';

type RawOpenAiResponse = {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type: string; text?: string }>;
    };
  }>;
};

const DEFAULT_MODEL = process.env.OPENAI_PARSE_MODEL || 'gpt-4o-mini';

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
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function normalizeParsedLevels(payload: any): ParsedLevels {
  const direction = payload?.direction === 'SHORT' ? 'SHORT' : 'LONG';

  const entry = sanitizeNumber(payload?.entry);
  const stop = sanitizeNumber(payload?.stop);
  const targetsSource = Array.isArray(payload?.targets) ? payload.targets : [];
  const targets = targetsSource
    .map((value) => sanitizeNumber(value))
    .filter((value): value is number => value != null);

  if (entry == null || stop == null || targets.length === 0) {
    throw new Error('Parsed values were incomplete.');
  }

  return {
    direction,
    entry,
    stop,
    targets,
  };
}

export async function parseScreenshotWithOpenAI(buffer: Buffer): Promise<ParsedLevels> {
  const apiKey = process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing OpenAI API key. Set OPENAI_API_KEY in the environment.');
  }

  if (!buffer?.length) {
    throw new Error('Empty screenshot buffer.');
  }

  const encoded = buffer.toString('base64');
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      temperature: 0,
      messages: [
        {
          role: 'system',
          content:
            'You extract numerical trade levels (entry, stop loss, up to three targets) from TradingView screenshots. Respond ONLY with strict JSON matching { "direction": "LONG"|"SHORT", "entry": number|null, "stop": number|null, "targets": [number] }. Do not include any other text. Numbers must be decimals with no percent signs.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Identify entry price, stop loss, and up to three take profit targets from this screenshot. Respond with JSON only.',
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/png;base64,${encoded}`,
              },
            },
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

  return normalizeParsedLevels(parsed);
}

