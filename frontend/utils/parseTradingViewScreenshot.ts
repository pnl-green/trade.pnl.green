import Tesseract from 'tesseract.js';

type CvRect = import('@techstark/opencv-js').Rect;
type CvMat = import('@techstark/opencv-js').Mat;

export type ParsedLevels = {
  direction: 'LONG' | 'SHORT';
  entry: number | null;
  stop: number | null;
  targets: number[];
};

export type RectangleDetection = {
  roi: CvRect;
  maskScore: number;
  hueLabel: 'green' | 'red' | 'neutral';
  center: { x: number; y: number };
};

type CVFactory = typeof import('@techstark/opencv-js');

const pricePattern = /(\d{3,5}\.\d{1,2})/g;
const minArea = 600;
const maxAspectSkew = 4.5;
const blueRange = {
  lower: [90, 80, 80],
  upper: [120, 255, 255],
};

function ensureCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function blobFromMat(cv: CVFactory, mat: CvMat): Promise<Blob> {
  const rgba = new cv.Mat();
  cv.cvtColor(mat, rgba, cv.COLOR_RGB2RGBA);
  const canvas = ensureCanvas(mat.cols, mat.rows);
  cv.imshow(canvas, rgba);
  rgba.delete();
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob as Blob), 'image/png'));
}

async function loadCV(): Promise<CVFactory> {
  const module = await import('@techstark/opencv-js');
  const cv = (module as { default?: CVFactory }).default || (module as CVFactory);
  return cv;
}

async function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export async function preprocessImage(image: HTMLImageElement): Promise<CvMat> {
  const cv = await loadCV();
  const canvas = ensureCanvas(image.naturalWidth || image.width, image.naturalHeight || image.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const mat = cv.matFromImageData(imageData) as CvMat;
  const rgb = new cv.Mat();
  cv.cvtColor(mat, rgb, cv.COLOR_RGBA2RGB);
  const blurred = new cv.Mat();
  cv.bilateralFilter(rgb, blurred, 9, 75, 75, cv.BORDER_DEFAULT);
  const lab = new cv.Mat();
  cv.cvtColor(blurred, lab, cv.COLOR_RGB2Lab);
  const clahe = new cv.CLAHE(2.0, new cv.Size(8, 8));
  const labChannels = new cv.MatVector();
  cv.split(lab, labChannels);
  const l = labChannels.get(0);
  clahe.apply(l, l);
  labChannels.set(0, l);
  cv.merge(labChannels, lab);
  const enhanced = new cv.Mat();
  cv.cvtColor(lab, enhanced, cv.COLOR_Lab2RGB);
  mat.delete();
  rgb.delete();
  blurred.delete();
  lab.delete();
  labChannels.delete();
  clahe.delete();
  l.delete();
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

export async function detectRectangles(mat: CvMat): Promise<RectangleDetection[]> {
  const cv = await loadCV();
  const mask = isolateSolidRects(cv, mat);
  const edges = new cv.Mat();
  cv.Canny(mask, edges, 50, 150, 3, false);

  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

  const hsv = new cv.Mat();
  cv.cvtColor(mat, hsv, cv.COLOR_RGB2HSV);

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

    const blueMask = colorMask(cv, hsv, blueRange.lower, blueRange.upper);
    const blueRoi = blueMask.roi(rect);
    const blueScore = cv.countNonZero(blueRoi) / area;
    blueRoi.delete();
    blueMask.delete();
    if (blueScore < 0.005) {
      contour.delete();
      continue;
    }

    const roi = hsv.roi(rect);
    const mean = cv.mean(roi);
    roi.delete();
    const hue = mean[0];
    let hueLabel: RectangleDetection['hueLabel'] = 'neutral';
    if (hue > 30 && hue < 100) hueLabel = 'green';
    if (hue < 20 || hue > 160) hueLabel = 'red';

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
  return detections;
}

export async function isolateTextRegions(
  mat: CvMat,
  detections: RectangleDetection[],
  padding = 8
): Promise<{ detection: RectangleDetection; crop: CvMat }[]> {
  const cv = await loadCV();
  const crops: { detection: RectangleDetection; crop: CvMat }[] = [];
  detections.forEach((detection) => {
    const { x, y, width, height } = detection.roi;
    const x0 = Math.max(0, x + 1 - padding);
    const y0 = Math.max(0, y + 1 - padding);
    const x1 = Math.min(mat.cols, x + width - 1 + padding);
    const y1 = Math.min(mat.rows, y + height - 1 + padding);
    const rect = new cv.Rect(x0, y0, x1 - x0, y1 - y0);
    const crop = mat.roi(rect);
    crops.push({ detection, crop });
  });
  return crops;
}

async function performOcr(blob: Blob, whitelist?: string): Promise<string> {
  const baseOptions = whitelist
    ? { tessedit_char_whitelist: whitelist }
    : undefined;
  const { data } = await Tesseract.recognize(blob, 'eng', {
    tessedit_pageseg_mode: Tesseract.PSM.SPARSE_TEXT,
    tessedit_char_blacklist: 'abcdefghijklmnopqrstuvwxyz',
    tessedit_char_whitelist: whitelist,
    tessedit_ocr_engine_mode: Tesseract.OEM.DEFAULT,
    logger: () => {},
  });
  return data.text || '';
}

export async function runOCR(crops: { detection: RectangleDetection; crop: CvMat }[]): Promise<
  { detection: RectangleDetection; rawText: string }
[]> {
  const cv = await loadCV();
  const results: { detection: RectangleDetection; rawText: string }[] = [];
  // Run OCR sequentially to reduce memory pressure
  for (const { detection, crop } of crops) {
    const blob = await blobFromMat(cv, crop);
    const fullText = await performOcr(blob);
    const digitsOnly = await performOcr(blob, '0123456789.');
    const text = [fullText, digitsOnly].sort((a, b) => b.length - a.length)[0];
    results.push({ detection, rawText: text });
    crop.delete();
  }
  return results;
}

function parseNumbers(text: string): number[] {
  return (text.match(pricePattern) || [])
    .map((token) => Number(token))
    .filter((v) => Number.isFinite(v) && v >= 100 && v <= 100000);
}

export function detectDirection(entryBox?: RectangleDetection, tpBox?: RectangleDetection, slBox?: RectangleDetection):
  | 'LONG'
  | 'SHORT'
  | null {
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

export function extractEntry(text: string, midpoint: number | null): number | null {
  const numbers = parseNumbers(text);
  if (!numbers.length) return null;
  if (midpoint === null) return numbers[0];
  return numbers.reduce((closest, candidate) =>
    Math.abs(candidate - midpoint) < Math.abs(closest - midpoint) ? candidate : closest
  );
}

export function extractSL(text: string, direction: 'LONG' | 'SHORT'): number | null {
  const numbers = parseNumbers(text);
  if (!numbers.length) return null;
  return direction === 'LONG' ? Math.min(...numbers) : Math.max(...numbers);
}

export function extractTP(text: string, direction: 'LONG' | 'SHORT'): number[] {
  const numbers = parseNumbers(text);
  if (!numbers.length) return [];
  const sorted = [...numbers].sort((a, b) => a - b);
  return direction === 'LONG' ? sorted.slice(-3).reverse() : sorted.slice(0, 3);
}

export async function getParsedLevels(file: File): Promise<ParsedLevels> {
  const image = await loadImageFromFile(file);
  const preprocessed = await preprocessImage(image);
  const rectangles = await detectRectangles(preprocessed);

  const tpBox = rectangles.find((d) => d.hueLabel === 'green');
  const slBox = rectangles.find((d) => d.hueLabel === 'red');
  const entryBox = rectangles.find((d) => d.hueLabel === 'neutral') || rectangles.find((d) => d.hueLabel === 'green');

  const crops = await isolateTextRegions(preprocessed, rectangles);
  const ocrResults = await runOCR(crops);

  const direction =
    detectDirection(entryBox, tpBox, slBox) || (tpBox && slBox && tpBox.center.y < slBox.center.y ? 'LONG' : 'SHORT');

  const tpText = ocrResults.find(({ detection }) => detection === tpBox)?.rawText || '';
  const slText = ocrResults.find(({ detection }) => detection === slBox)?.rawText || '';
  const entryText = ocrResults.find(({ detection }) => detection === entryBox)?.rawText || '';

  const rawSl = direction && slText ? extractSL(slText, direction) : null;
  const rawTps = direction && tpText ? extractTP(tpText, direction) : [];
  const midpoint = rawSl !== null && rawTps.length ? (rawSl + rawTps[0]) / 2 : null;
  const entry = entryText ? extractEntry(entryText, midpoint) : null;

  preprocessed.delete();

  return {
    direction: direction || 'LONG',
    entry,
    stop: rawSl,
    targets: rawTps,
  };
}
