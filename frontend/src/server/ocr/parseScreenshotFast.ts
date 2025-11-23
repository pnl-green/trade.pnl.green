import Jimp from 'jimp';
import Tesseract from 'tesseract.js';
import type { ParsedLevels } from '@/types/tradeLevels';

type RegionKind = 'tp' | 'sl' | 'entry';

interface RowInfo {
  kind: RegionKind | null;
  minX: number;
  maxX: number;
}

interface Segment {
  kind: RegionKind;
  yStart: number;
  yEnd: number;
  minX: number;
  maxX: number;
  score: number;
}

const RIGHT_COLUMN_RATIO = 0.25;
const SAMPLE_STEP_X = 2;
const MIN_ROW_RATIO = 0.35;
const MIN_SEGMENT_HEIGHT = 16;
const GAP_TOLERANCE = 2;
const PAD_X = 8;
const PAD_Y = 6;

function rgbToHsl(r: number, g: number, b: number) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = (gn - bn) / d + (gn < bn ? 6 : 0);
        break;
      case gn:
        h = (bn - rn) / d + 2;
        break;
      case bn:
        h = (rn - gn) / d + 4;
        break;
      default:
        break;
    }
    h /= 6;
  }

  return { h: h * 360, s, l };
}

function classifyColor(r: number, g: number, b: number): RegionKind | null {
  const { h, s, l } = rgbToHsl(r, g, b);

  if (l < 0.18) {
    return null;
  }

  if (s < 0.18 && l >= 0.25 && l <= 0.8) {
    return 'entry';
  }

  if (s > 0.25) {
    if (h >= 85 && h <= 155 && l <= 0.8) {
      return 'tp';
    }
    if ((h >= 0 && h <= 25) || h >= 330) {
      return 'sl';
    }
  }

  return null;
}

function buildRowMap(image: Jimp, startX: number): RowInfo[] {
  const { width, height, data } = image.bitmap;
  const rows: RowInfo[] = new Array(height);

  for (let y = 0; y < height; y += 1) {
    const counts: Record<RegionKind, number> = { tp: 0, sl: 0, entry: 0 };
    let minX = width;
    let maxX = -1;
    let totalSamples = 0;

    for (let x = startX; x < width; x += SAMPLE_STEP_X) {
      const idx = (width * y + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const kind = classifyColor(r, g, b);
      if (kind) {
        counts[kind] += 1;
        totalSamples += 1;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
      }
    }

    let selected: RegionKind | null = null;
    let bestCount = 0;
    (Object.keys(counts) as RegionKind[]).forEach((kind) => {
      if (counts[kind] > bestCount) {
        bestCount = counts[kind];
        selected = kind;
      }
    });

    if (selected && totalSamples > 0 && bestCount / totalSamples >= MIN_ROW_RATIO) {
      rows[y] = {
        kind: selected,
        minX: minX === width ? startX : minX,
        maxX: maxX === -1 ? width - 1 : maxX,
      };
    } else {
      rows[y] = { kind: null, minX: startX, maxX: width - 1 };
    }
  }

  return rows;
}

function buildSegments(rows: RowInfo[]): Segment[] {
  const segments: Segment[] = [];
  let current: Segment | null = null;
  let gap = 0;

  for (let y = 0; y < rows.length; y += 1) {
    const row = rows[y];
    if (!row.kind) {
      if (current) {
        gap += 1;
        if (gap > GAP_TOLERANCE) {
          if (current.yEnd - current.yStart + 1 >= MIN_SEGMENT_HEIGHT) {
            segments.push(current);
          }
          current = null;
          gap = 0;
        }
      }
      continue;
    }

    if (!current || current.kind !== row.kind) {
      if (current && current.yEnd - current.yStart + 1 >= MIN_SEGMENT_HEIGHT) {
        segments.push(current);
      }
      current = {
        kind: row.kind,
        yStart: y,
        yEnd: y,
        minX: row.minX,
        maxX: row.maxX,
        score: row.maxX - row.minX,
      };
      gap = 0;
    } else {
      current.yEnd = y;
      if (row.minX < current.minX) current.minX = row.minX;
      if (row.maxX > current.maxX) current.maxX = row.maxX;
      current.score += row.maxX - row.minX;
      gap = 0;
    }
  }

  if (current && current.yEnd - current.yStart + 1 >= MIN_SEGMENT_HEIGHT) {
    segments.push(current);
  }

  return segments;
}

async function cropSegment(image: Jimp, segment: Segment, startX: number): Promise<Jimp> {
  const { width, height } = image.bitmap;
  const x0 = Math.max(startX, segment.minX - PAD_X);
  const y0 = Math.max(0, segment.yStart - PAD_Y);
  const x1 = Math.min(width, segment.maxX + PAD_X);
  const y1 = Math.min(height, segment.yEnd + PAD_Y);
  const w = Math.max(10, x1 - x0);
  const h = Math.max(10, y1 - y0);
  return image.clone().crop(x0, y0, w, h);
}

async function ocrNumber(crop: Jimp): Promise<number | null> {
  const buffer = await crop.getBufferAsync(Jimp.MIME_PNG);
  const { data } = await Tesseract.recognize(buffer, 'eng', {
    tessedit_pageseg_mode: Tesseract.PSM.SINGLE_LINE,
    tessedit_char_whitelist: '0123456789.',
    logger: () => {},
  });
  const text = (data.text || '').replace(/[^\d.]/g, '');
  const match = text.match(/(\d{3,5}\.\d{1,4})/);
  if (!match) return null;
  const value = parseFloat(match[1]);
  if (!Number.isFinite(value) || value < 100 || value > 200000) return null;
  return value;
}

function pickSegment(segments: Segment[], kind: RegionKind, limit = 1) {
  return segments
    .filter((segment) => segment.kind === kind)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function determineDirection(entry: number | null, stop: number | null, targets: number[]): 'LONG' | 'SHORT' {
  if (entry != null && targets.length > 0) {
    if (targets[0] > entry) return 'LONG';
    if (targets[0] < entry) return 'SHORT';
  }
  if (entry != null && stop != null) {
    return stop < entry ? 'LONG' : 'SHORT';
  }
  return 'LONG';
}

export async function parseScreenshotFast(buffer: Buffer): Promise<ParsedLevels> {
  const image = await Jimp.read(buffer);
  const { width, height } = image.bitmap;
  const columnWidth = Math.max(Math.floor(width * RIGHT_COLUMN_RATIO), 160);
  const startX = Math.max(0, width - columnWidth);

  const rows = buildRowMap(image, startX);
  const segments = buildSegments(rows);

  if (!segments.length) {
    throw new Error('No trade annotations detected in screenshot.');
  }

  const entrySegment = pickSegment(segments, 'entry')[0];
  const slSegment = pickSegment(segments, 'sl')[0];
  const tpSegments = pickSegment(segments, 'tp', 3);

  if (!entrySegment || !slSegment || !tpSegments.length) {
    throw new Error('Unable to locate entry/stop/targets in screenshot.');
  }

  const entry = await ocrNumber(await cropSegment(image, entrySegment, startX));
  const stop = await ocrNumber(await cropSegment(image, slSegment, startX));

  const targetValues: number[] = [];
  for (const tp of tpSegments) {
    const value = await ocrNumber(await cropSegment(image, tp, startX));
    if (value != null) {
      targetValues.push(value);
    }
  }

  if (entry == null || stop == null || !targetValues.length) {
    throw new Error('Parsed values were incomplete.');
  }

  const direction = determineDirection(entry, stop, targetValues);
  const targets =
    direction === 'LONG'
      ? [...targetValues].sort((a, b) => b - a)
      : [...targetValues].sort((a, b) => a - b);

  return {
    direction,
    entry,
    stop,
    targets,
  };
}

