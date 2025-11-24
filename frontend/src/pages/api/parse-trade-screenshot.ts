import type { NextApiRequest, NextApiResponse } from 'next';
import formidable, { type Fields, type Files, type File } from 'formidable';
import fs from 'fs/promises';
import { parseScreenshotWithOpenAI } from '@/server/ocr/openAiScreenshotParser';
import {
  ScreenshotParseCodes,
  type ScreenshotParseDebugPayload,
  type ScreenshotParseLogEntry,
  type ParsedLevelsPartial,
  type ScreenshotParseCompleteness,
} from '@/types/screenshotParsing';

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
  const uploaded = (files as any).image || (files as any).file || files.image;
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
  res: NextApiResponse<ScreenshotParseDebugPayload>
) {
  const logs: ScreenshotParseLogEntry[] = [];
  const pushLog = (entry: Omit<ScreenshotParseLogEntry, 'timestamp'>) => {
    logs.push({ ...entry, timestamp: new Date().toISOString() });
  };

  pushLog({
    level: 'info',
    phase: 'server-receive',
    code: ScreenshotParseCodes.REQUEST_START,
    message: 'Incoming screenshot parse request',
    details: { method: req.method },
  });

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    pushLog({
      level: 'error',
      phase: 'server-validate',
      code: ScreenshotParseCodes.METHOD_NOT_ALLOWED,
      message: 'Only POST is supported for this endpoint',
      details: { method: req.method },
    });
    return res.status(200).json({
      success: false,
      errorCode: ScreenshotParseCodes.METHOD_NOT_ALLOWED,
      errorMessage: 'Method Not Allowed',
      logs,
    });
  }

  try {
    const { files } = await parseForm(req).catch((error) => {
      pushLog({
        level: 'error',
        phase: 'server-validate',
        code: ScreenshotParseCodes.PARSE_FORM_ERROR,
        message: 'Failed to parse multipart form',
        details: { message: (error as Error)?.message },
      });
      throw error;
    });
    pushLog({
      level: 'info',
      phase: 'server-validate',
      code: ScreenshotParseCodes.REQUEST_BODY_OK,
      message: 'Form parsed successfully',
    });
    const file = extractFile(files);
    if (!file) {
      pushLog({
        level: 'error',
        phase: 'server-validate',
        code: ScreenshotParseCodes.NO_FILE,
        message: 'No image file provided',
      });
      return res.status(200).json({
        success: false,
        errorCode: ScreenshotParseCodes.NO_FILE,
        errorMessage: 'Image file is required',
        logs,
      });
    }

    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      pushLog({
        level: 'error',
        phase: 'server-validate',
        code: ScreenshotParseCodes.UNSUPPORTED_MIME,
        message: 'Unsupported file type',
        details: { mimetype: file.mimetype },
      });
      return res.status(200).json({
        success: false,
        errorCode: ScreenshotParseCodes.UNSUPPORTED_MIME,
        errorMessage: 'Unsupported file type',
        logs,
      });
    }

    const buffer = await readFileBuffer(file);
    pushLog({
      level: 'info',
      phase: 'server-receive',
      code: ScreenshotParseCodes.FILE_READ_OK,
      message: 'Image file read into buffer',
      details: { size: buffer.length, mimetype: file.mimetype },
    });

    const result = await withTimeout(parseScreenshotWithOpenAI(buffer, pushLog), 10000);

    const parsedPayload: ParsedLevelsPartial = {
      direction: result.direction ?? null,
      entry: result.entry ?? null,
      stop: result.stop ?? null,
      tp: result.tp ?? null,
      confidence: result.confidence ?? null,
    };

    const completeness: ScreenshotParseCompleteness = {
      direction: parsedPayload.direction !== null,
      entry: parsedPayload.entry !== null,
      stop: parsedPayload.stop !== null,
      tp: parsedPayload.tp !== null,
    };

    const isSoftSuccess = completeness.direction && completeness.entry;

    pushLog({
      level: isSoftSuccess ? 'info' : 'warn',
      phase: 'server-build-json',
      code: isSoftSuccess ? ScreenshotParseCodes.MAPPING_OK : ScreenshotParseCodes.MISSING_FIELDS,
      message: isSoftSuccess
        ? 'Mapped parsed values successfully'
        : 'Parsed response missing required direction or entry',
      details: {
        hasDirection: completeness.direction,
        hasEntry: completeness.entry,
        hasStop: completeness.stop,
        hasTp: completeness.tp,
      },
    });

    if (!isSoftSuccess) {
      return res.status(200).json({
        success: false,
        errorCode: ScreenshotParseCodes.MISSING_FIELDS,
        errorMessage: 'Unable to detect trade direction and entry from the screenshot.',
        parsed: parsedPayload,
        completeness,
        logs,
      });
    }

    return res.status(200).json({
      success: true,
      parsed: parsedPayload,
      completeness,
      logs,
    });
  } catch (error) {
    if ((error as Error).message === 'OCR_TIMEOUT') {
      pushLog({
        level: 'error',
        phase: 'server-model-call',
        code: ScreenshotParseCodes.OPENAI_TIMEOUT,
        message: 'Screenshot parsing timed out',
      });
      return res.status(200).json({
        success: false,
        errorCode: ScreenshotParseCodes.OPENAI_TIMEOUT,
        errorMessage: 'Screenshot parsing took too long. Please try again.',
        logs,
      });
    }

    const errorCode = (error as any)?.code as string | undefined;

    if (errorCode) {
      pushLog({
        level: 'error',
        phase: 'server-parse-response',
        code: errorCode,
        message: 'Screenshot parsing failed',
        details: { message: (error as Error)?.message },
      });

      return res.status(200).json({
        success: false,
        errorCode,
        errorMessage: (error as Error).message,
        logs,
      });
    }

    pushLog({
      level: 'error',
      phase: 'server-unexpected' as any,
      code: ScreenshotParseCodes.UNHANDLED_EXCEPTION,
      message: 'Unhandled error in screenshot parsing route',
      details: {
        name: (error as Error)?.name,
        message: (error as Error)?.message,
        stack: (error as Error)?.stack?.slice(0, 400),
      },
    });
    console.error('parse-trade-screenshot failed', error);
    return res.status(200).json({
      success: false,
      errorCode: ScreenshotParseCodes.UNHANDLED_EXCEPTION,
      errorMessage: (error as Error).message || 'Failed to parse screenshot',
      logs,
    });
  }
}
