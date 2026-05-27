/**
 * Descriptive statistics — all math from scratch, no libraries.
 */

export function mean(data: number[]): number {
  if (data.length === 0) return 0;
  return data.reduce((s, v) => s + v, 0) / data.length;
}

export function median(data: number[]): number {
  if (data.length === 0) return 0;
  const sorted = [...data].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) {
    return sorted[mid]!;
  }
  return (sorted[mid - 1]! + sorted[mid]!) / 2;
}

export function mode(data: number[]): number[] {
  if (data.length === 0) return [];
  const freq = new Map<number, number>();
  for (const v of data) {
    freq.set(v, (freq.get(v) ?? 0) + 1);
  }
  let maxFreq = 0;
  for (const count of freq.values()) {
    if (count > maxFreq) maxFreq = count;
  }
  if (maxFreq === 1) return []; // no mode
  const modes: number[] = [];
  for (const [val, count] of freq.entries()) {
    if (count === maxFreq) modes.push(val);
  }
  return modes.sort((a, b) => a - b);
}

export function variance(data: number[], population = false): number {
  if (data.length < 2) return 0;
  const m = mean(data);
  const sumSq = data.reduce((s, v) => s + (v - m) ** 2, 0);
  return sumSq / (population ? data.length : data.length - 1);
}

export function stddev(data: number[], population = false): number {
  return Math.sqrt(variance(data, population));
}

export function min(data: number[]): number {
  if (data.length === 0) return 0;
  return Math.min(...data);
}

export function max(data: number[]): number {
  if (data.length === 0) return 0;
  return Math.max(...data);
}

export function range(data: number[]): number {
  if (data.length === 0) return 0;
  return max(data) - min(data);
}

/** Returns Q1 (25th percentile) using linear interpolation. */
export function q1(data: number[]): number {
  return percentile(data, 0.25);
}

/** Returns Q3 (75th percentile) using linear interpolation. */
export function q3(data: number[]): number {
  return percentile(data, 0.75);
}

export function iqr(data: number[]): number {
  return q3(data) - q1(data);
}

export function percentile(data: number[], p: number): number {
  if (data.length === 0) return 0;
  const sorted = [...data].sort((a, b) => a - b);
  if (sorted.length === 1) return sorted[0]!;
  const index = p * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower]!;
  const lowerVal = sorted[lower]!;
  const upperVal = sorted[upper]!;
  return lowerVal + (upperVal - lowerVal) * (index - lower);
}

export function skewness(data: number[]): number {
  if (data.length < 3) return 0;
  const n = data.length;
  const m = mean(data);
  const s = stddev(data);
  if (s === 0) return 0;
  const sum3 = data.reduce((acc, v) => acc + ((v - m) / s) ** 3, 0);
  return (n / ((n - 1) * (n - 2))) * sum3;
}

export function kurtosis(data: number[]): number {
  if (data.length < 4) return 0;
  const n = data.length;
  const m = mean(data);
  const s = stddev(data);
  if (s === 0) return 0;
  const sum4 = data.reduce((acc, v) => acc + ((v - m) / s) ** 4, 0);
  const num = (n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3));
  const correction = (3 * (n - 1) ** 2) / ((n - 2) * (n - 3));
  return num * sum4 - correction;
}

export interface DescriptiveStats {
  count: number;
  mean: number;
  median: number;
  mode: number[];
  stddev: number;
  variance: number;
  min: number;
  max: number;
  range: number;
  q1: number;
  q3: number;
  iqr: number;
  skewness: number;
  kurtosis: number;
}

export function computeDescriptive(data: number[]): DescriptiveStats {
  return {
    count: data.length,
    mean: mean(data),
    median: median(data),
    mode: mode(data),
    stddev: stddev(data),
    variance: variance(data),
    min: min(data),
    max: max(data),
    range: range(data),
    q1: q1(data),
    q3: q3(data),
    iqr: iqr(data),
    skewness: skewness(data),
    kurtosis: kurtosis(data),
  };
}

export function parseDataInput(raw: string): number[] {
  return raw
    .split(/[,\n\r\t]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map(Number)
    .filter((n) => !isNaN(n));
}
