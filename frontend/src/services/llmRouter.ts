export type ModelName =
  | 'gpt-4.1-mini'
  | 'gpt-4.1'
  | 'gpt-o1'
  | 'gpt-o1-preview';

type AskLLMArgs = {
  prompt: string;
  images?: string[];
  systemPrompt?: string;
};

const fastKeywords = ['quick', 'fast', 'summary', 'tl;dr', 'short'];
const reasoningKeywords = ['why', 'explain', 'reason', 'analysis', 'detailed'];
const tradingKeywords = ['strategy', 'entry', 'stop', 'take profit', 'tp', 'sl', 'code'];

export async function routeModel(prompt: string): Promise<ModelName> {
  const normalized = prompt.toLowerCase();
  if (tradingKeywords.some((k) => normalized.includes(k))) {
    return 'gpt-o1-preview';
  }
  if (reasoningKeywords.some((k) => normalized.includes(k))) {
    return 'gpt-o1';
  }
  if (fastKeywords.some((k) => normalized.includes(k)) || normalized.length < 120) {
    return 'gpt-4.1-mini';
  }
  return 'gpt-4.1';
}

export async function askLLM({ prompt, images, systemPrompt }: AskLLMArgs) {
  const model = await routeModel(prompt);
  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  const body: any = {
    model,
    messages: [
      ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          ...(images?.map((image) => ({ type: 'image_url', image_url: { url: image } })) || []),
        ],
      },
    ],
  };

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`LLM request failed: ${response.statusText}`);
    }
    const json = await response.json();
    const message = json?.choices?.[0]?.message?.content;
    return { message: Array.isArray(message) ? message.map((m: any) => m.text).join('\n') : message, model };
  } catch (error) {
    console.error('askLLM error', error);
    return { message: 'Assistant is unavailable right now. Please try again.', model };
  }
}
