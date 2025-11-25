/**
 * Spectrum Math Utilities
 * Based on Amethyst's math utilities for spectrum processing
 */

export const VISUALIZER_BIN_COUNT = 960;

/**
 * Normalize 8-bit value (0-255) to 0-1 range
 */
export function normalize8bit(value) {
  return Math.max(0, Math.min(255, value)) / 255;
}

/**
 * Logarithmic parabolic spectrum interpolation
 * Converts frequency data to a smoother logarithmic representation
 * Based on Amethyst's logParabolicSpectrum
 */
export function logParabolicSpectrum(dataArray, outputLength = VISUALIZER_BIN_COUNT) {
  const maxIndex = dataArray.length - 1;
  const result = new Float32Array(outputLength);

  for (let i = 0; i < outputLength; i++) {
    // Logarithmic virtual index
    const logIndex = Math.pow(maxIndex, i / (outputLength - 1));

    // Floor to get base index, get fraction for interpolation
    const base = Math.floor(logIndex);
    const t = logIndex - base;

    // Get 3 y values for interpolation
    const y0 = dataArray[Math.max(base - 1, 0)];
    const y1 = dataArray[base];
    const y2 = dataArray[Math.min(base + 1, maxIndex)];

    // Parabolic interpolation
    const a = (y0 - 2 * y1 + y2) / 2;
    const b = (y2 - y0) / 2;
    const c = y1;

    const y = a * t * t + b * t + c;

    result[i] = y / 255;
  }

  return result;
}

/**
 * Linear spectrum interpolation
 */
export function linearSpectrum(dataArray, outputLength) {
  const inputLength = dataArray.length - 1;
  const result = new Float32Array(outputLength);

  for (let i = 0; i < outputLength; i++) {
    // Linearly mapped index
    const linearIndex = (i / (outputLength - 1)) * inputLength;

    const base = Math.floor(linearIndex);
    const t = linearIndex - base;

    const y0 = dataArray[base];
    const y1 = dataArray[Math.min(base + 1, inputLength)];

    // Linear interpolation
    const y = y0 + (y1 - y0) * t;

    result[i] = y / 255;
  }

  return result;
}

