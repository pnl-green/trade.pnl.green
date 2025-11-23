import type { NextApiRequest, NextApiResponse } from 'next';
import formidable, { type Fields, type Files, type File } from 'formidable';
import fs from 'fs/promises';
import { parseScreenshotFast } from '@/server/ocr/parseScreenshotFast';
import type { ParsedLevels } from '@/types/tradeLevels';

type ErrorResponse = { error: string };

export const config = {
  api: {
    bodyParser: false,
    sizeLimit: '10mb',
  },
};

function parseForm(req: NextApiRequest) {
  const form = formidable({
    multiples: false,
    maxFiles: 1,
    maxFileSize: 8 * 1024 * 1024,
    filter: ({ mimetype }) => Boolean(mimetype && mimetype.startsWith('image/')),
  });

  return new Promise<{ fields: Fields; files: Files }>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

function extractFile(files: Files): File | null {
  const uploaded = files.image;
  if (!uploaded) return null;
  if (Array.isArray(uploaded)) {
    return uploaded[0];
  }
  return uploaded;
}

async function readFileBuffer(file: File): Promise<Buffer> {
  const filepath = (file as File & { filepath?: string }).filepath || (file as any).filepath || file.filepath;
  const buffer = await fs.readFile(filepath);
  await fs.unlink(filepath).catch(() => {});
  return buffer;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('OCR_TIMEOUT')), timeoutMs);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ParsedLevels | ErrorResponse>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { files } = await parseForm(req);
    const file = extractFile(files);
    if (!file) {
      return res.status(400).json({ error: 'Image file is required' });
    }

    const buffer = await readFileBuffer(file);
    const result = await withTimeout(parseScreenshotFast(buffer), 4000);
    return res.status(200).json(result);
  } catch (error) {
    if ((error as Error).message === 'OCR_TIMEOUT') {
      return res.status(504).json({ error: 'Screenshot parsing took too long. Please try again.' });
    }
    console.error('parse-trade-screenshot failed', error);
    return res.status(500).json({ error: 'Failed to parse screenshot' });
  }
}

