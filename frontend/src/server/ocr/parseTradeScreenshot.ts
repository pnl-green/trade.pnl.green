import Jimp from 'jimp';
import { ParsedLevels } from '@/types/tradeLevels';

type CVFactory = typeof import('@techstark/opencv-js');
type CvMat = import('@techstark/opencv-js').Mat;
type CvRect = import('@techstark/opencv-js').Rect;
type TesseractModule = typeof import('tesseract.js');

export type RectangleDetection = {
  roi: CvRect;
  maskScore: number;
  hueLabel: 'green' | 'red' | 'neutral';
  center: { x: number; y: number };
};

const pricePattern = /(\d{3,5}\.\d{1,4})/g;
const minArea = 600;
const maxAspectSkew = 4.5;
const blueRange = {
  lower: [90, 80, 80],
  upper: [120, 255, 255],
};

let cvPromise: Promise<CVFactory> | null = null;
let tesseractPromise: Promise<TesseractModule> | null = null;

async function loadCV(): Promise<CVFactory> {
  if (!cvPromise) {
    cvPromise = import('@techstark/opencv-js').then((module: any) => module.default || module);
  }
  return cvPromise;
}

async function loadTesseract(): Promise<TesseractModule> {
  if (!tesseractPromise) {
    tesseractPromise = import('tesseract.js').then((module: any) => module.default || module);
  }
  return tesseractPromise;
}

async function matFromBuffer(buffer: Buffer): Promise<CvMat> {
  const cv = await loadCV();
  const image = await Jimp.read(buffer);
  const { data, width, height } = image.bitmap;
  const clamped = new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength);
  const imageData = { data: clamped, width, height };
  const mat = cv.matFromImageData(imageData);
  const rgb = new cv.Mat();
  cv.cvtColor(mat, rgb, cv.COLOR_RGBA2RGB);
  mat.delete();
  return rgb;
}

async function preprocess(buffer: Buffer): Promise<CvMat> {
  const cv = await loadCV();
  const base = await matFromBuffer(buffer);
  const blurred = new cv.Mat();
  cv.bilateralFilter(base, blurred, 9, 75, 75, cv.BORDER_DEFAULT);
  const lab = new cv.Mat();
  cv.cvtColor(blurred, lab, cv.COLOR_RGB2Lab);
  const clahe = new cv.CLAHE(2.0, new cv.Size(8, 8));
  const labChannels = new cv.MatVector();
  cv.split(lab, labChannels);
  const l = labChannels.get(0);
  clahe.apply(l, l);
  labChannels.set(0, l);
  const enhancedLab = new cv.Mat();
  cv.merge(labChannels, enhancedLab);
  const enhanced = new cv.Mat();
  cv.cvtColor(enhancedLab, enhanced, cv.COLOR_Lab2RGB);

  base.delete();
  blurred.delete();
  lab.delete();
  labChannels.delete();
  clahe.delete();
  l.delete();
  enhancedLab.delete();
  return enhanced;
}

function colorMask(cv: CVFactory, hsv: CvMat, lower: number[], upper: number[]): CvMat {
  const low = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), lower);
  const high = new cv.Mat(hsv.rows, hsv.cols, hsv.type(), upper);
  const mask = new cv.Mat();
  cv.inRange(hsv, low, high, mask);
  low.delete();
  high.delete();
  return mask;
}

function isolateSolidRects(cv: CVFactory, mat: CvMat): CvMat {
  const hsv = new cv.Mat();
  cv.cvtColor(mat, hsv, cv.COLOR_RGB2HSV);
  const greenMask = colorMask(cv, hsv, [35, 40, 40], [95, 255, 255]);
  const redMask1 = colorMask(cv, hsv, [0, 70, 40], [10, 255, 255]);
  const redMask2 = colorMask(cv, hsv, [170, 70, 40], [180, 255, 255]);
  const mergedRed = new cv.Mat();
  cv.add(redMask1, redMask2, mergedRed);
  const neutralMask = colorMask(cv, hsv, [15, 15, 40], [35, 80, 240]);

  const blueMask = colorMask(cv, hsv, blueRange.lower, blueRange.upper);
  const dilatedBlue = new cv.Mat();
  cv.dilate(blueMask, dilatedBlue, cv.Mat.ones(3, 3, cv.CV_8U));

  const combined = new cv.Mat();
  cv.addWeighted(greenMask, 1, mergedRed, 1, 0, combined);
  cv.addWeighted(combined, 1, neutralMask, 0.6, 0, combined);
  cv.bitwise_and(combined, dilatedBlue, combined);

  const kernel = cv.Mat.ones(5, 5, cv.CV_8U);
  cv.morphologyEx(combined, combined, cv.MORPH_CLOSE, kernel);
  kernel.delete();
  hsv.delete();
  greenMask.delete();
  redMask1.delete();
  redMask2.delete();
  mergedRed.delete();
  neutralMask.delete();
  blueMask.delete();
  dilatedBlue.delete();
  return combined;
}

async function detectRectangles(cv: CVFactory, mat: CvMat): Promise<RectangleDetection[]> {
  const mask = isolateSolidRects(cv, mat);
  const edges = new cv.Mat();
  cv.Canny(mask, edges, 50, 150, 3, false);

  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

  const hsv = new cv.Mat();
  cv.cvtColor(mat, hsv, cv.COLOR_RGB2HSV);
  const blueMask = colorMask(cv, hsv, blueRange.lower, blueRange.upper);

  const detections: RectangleDetection[] = [];
  for (let i = 0; i < contours.size(); i += 1) {
    const contour = contours.get(i);
    const rect = cv.boundingRect(contour);
    const area = rect.width * rect.height;
    const aspect = rect.width / rect.height;
    if (area < minArea || aspect > maxAspectSkew || aspect < 0.5) {
      contour.delete();
      continue;
    }

    const blueRoi = blueMask.roi(rect);
    const blueScore = cv.countNonZero(blueRoi) / area;
    blueRoi.delete();
    if (blueScore < 0.005) {
      contour.delete();
      continue;
    }

    const roi = hsv.roi(rect);
    const mean = cv.mean(roi);
    roi.delete();
    let hueLabel: RectangleDetection['hueLabel'] = 'neutral';
    if (mean[0] > 30 && mean[0] < 100) hueLabel = 'green';
    if (mean[0] < 20 || mean[0] > 160) hueLabel = 'red';

    detections.push({
      roi: rect,
      maskScore: blueScore,
      hueLabel,
      center: { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 },
    });
    contour.delete();
  }

  mask.delete();
  edges.delete();
  contours.delete();
  hierarchy.delete();
  hsv.delete();
  blueMask.delete();
  return detections;
}

function isolateTextRegions(cv: CVFactory, mat: CvMat, detections: RectangleDetection[], padding = 8) {
  return detections.map((detection) => {
    const { x, y, width, height } = detection.roi;
    const x0 = Math.max(0, x + 1 - padding);
    const y0 = Math.max(0, y + 1 - padding);
    const x1 = Math.min(mat.cols, x + width - 1 + padding);
    const y1 = Math.min(mat.rows, y + height - 1 + padding);
    const rect = new cv.Rect(x0, y0, x1 - x0, y1 - y0);
    const crop = mat.roi(rect);
    return { detection, crop };
  });
}

async function matToPngBuffer(mat: CvMat): Promise<Buffer> {
  const cv = await loadCV();
  const rgba = new cv.Mat();
  cv.cvtColor(mat, rgba, cv.COLOR_RGB2RGBA);
  const jimpImage = await new Jimp({ data: Buffer.from(rgba.data), width: rgba.cols, height: rgba.rows });
  const buffer = await jimpImage.getBufferAsync(Jimp.MIME_PNG);
  rgba.delete();
  return buffer;
}

async function performOcr(buffer: Buffer, whitelist?: string): Promise<string> {
  const Tesseract = await loadTesseract();
  const { data } = await Tesseract.recognize(buffer, 'eng', {
    tessedit_pageseg_mode: Tesseract.PSM.SPARSE_TEXT,
    tessedit_char_blacklist: 'abcdefghijklmnopqrstuvwxyz',
    tessedit_char_whitelist: whitelist,
    tessedit_ocr_engine_mode: Tesseract.OEM.DEFAULT,
    logger: () => {},
  });
  return data.text || '';
}

async function runOCR(crops: { detection: RectangleDetection; crop: CvMat }[]) {
  const results: { detection: RectangleDetection; rawText: string }[] = [];
  for (const { detection, crop } of crops) {
    const buffer = await matToPngBuffer(crop);
    const fullText = await performOcr(buffer);
    const digitsOnly = await performOcr(buffer, '0123456789.');
    const text = [fullText, digitsOnly].sort((a, b) => b.length - a.length)[0];
    results.push({ detection, rawText: text });
    crop.delete();
  }
  return results;
}

function parseNumbers(text: string): number[] {
  return (text.match(pricePattern) || [])
    .map((token) => Number(token))
    .filter((v) => Number.isFinite(v) && v >= 100 && v <= 200000);
}

function detectDirection(
  entryBox?: RectangleDetection,
  tpBox?: RectangleDetection,
  slBox?: RectangleDetection
): 'LONG' | 'SHORT' | null {
  if (entryBox && tpBox) {
    return tpBox.center.y < entryBox.center.y ? 'LONG' : 'SHORT';
  }
  if (entryBox && slBox) {
    return slBox.center.y < entryBox.center.y ? 'SHORT' : 'LONG';
  }
  if (tpBox && slBox) {
    return tpBox.center.y < slBox.center.y ? 'LONG' : 'SHORT';
  }
  return null;
}

function extractEntry(text: string, midpoint: number | null): number | null {
  const numbers = parseNumbers(text);
  if (!numbers.length) return null;
  if (midpoint === null) return numbers[0];
  return numbers.reduce((closest, candidate) =>
    Math.abs(candidate - midpoint) < Math.abs(closest - midpoint) ? candidate : closest
  );
}

function extractSL(text: string, direction: 'LONG' | 'SHORT'): number | null {
  const numbers = parseNumbers(text);
  if (!numbers.length) return null;
  return direction === 'LONG' ? Math.min(...numbers) : Math.max(...numbers);
}

function extractTP(text: string, direction: 'LONG' | 'SHORT'): number[] {
  const numbers = parseNumbers(text);
  if (!numbers.length) return [];
  const sorted = [...numbers].sort((a, b) => a - b);
  const values = direction === 'LONG' ? sorted.slice(-3).reverse() : sorted.slice(0, 3);
  return values;
}

export async function parseTradeScreenshot(buffer: Buffer): Promise<ParsedLevels> {
  const cv = await loadCV();
  const preprocessed = await preprocess(buffer);

  try {
    const rectangles = await detectRectangles(cv, preprocessed);
    if (!rectangles.length) {
      throw new Error('Unable to locate trade annotations');
    }
    const tpBox = rectangles.find((d) => d.hueLabel === 'green');
    const slBox = rectangles.find((d) => d.hueLabel === 'red');
    const entryBox =
      rectangles.find((d) => d.hueLabel === 'neutral') ||
      rectangles.find((d) => d.hueLabel === 'green') ||
      rectangles[0];

    const crops = isolateTextRegions(cv, preprocessed, rectangles);
    const ocrResults = await runOCR(crops);

    const direction = detectDirection(entryBox, tpBox, slBox) || 'LONG';
    const tpText = ocrResults.find(({ detection }) => detection === tpBox)?.rawText || '';
    const slText = ocrResults.find(({ detection }) => detection === slBox)?.rawText || '';
    const entryText = ocrResults.find(({ detection }) => detection === entryBox)?.rawText || '';

    const stop = slText ? extractSL(slText, direction) : null;
    const targets = tpText ? extractTP(tpText, direction) : [];
    const midpoint = stop !== null && targets.length ? (stop + targets[0]) / 2 : null;
    const entry = entryText ? extractEntry(entryText, midpoint) : null;

    return {
      direction,
      entry,
      stop,
      targets,
    };
  } finally {
    preprocessed.delete();
  }
}

