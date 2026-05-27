/**
 * Linear regression — from scratch.
 */

export interface RegressionResult {
  slope: number;
  intercept: number;
  rSquared: number;
  equation: string;
}

export function linearRegression(
  xs: number[],
  ys: number[],
): RegressionResult | null {
  const n = Math.min(xs.length, ys.length);
  if (n < 2) return null;

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  let sumY2 = 0;

  for (let i = 0; i < n; i++) {
    const x = xs[i]!;
    const y = ys[i]!;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
    sumY2 += y * y;
  }

  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return null;

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  // R^2
  const meanY = sumY / n;
  let ssTot = 0;
  let ssRes = 0;
  for (let i = 0; i < n; i++) {
    const x = xs[i]!;
    const y = ys[i]!;
    const yPred = slope * x + intercept;
    ssTot += (y - meanY) ** 2;
    ssRes += (y - yPred) ** 2;
  }
  const rSquared = ssTot === 0 ? 1 : 1 - ssRes / ssTot;

  const slopeStr = slope.toFixed(4);
  const interceptStr =
    intercept >= 0 ? `+ ${intercept.toFixed(4)}` : `- ${Math.abs(intercept).toFixed(4)}`;
  const equation = `ŷ = ${slopeStr}x ${interceptStr}`;

  return { slope, intercept, rSquared, equation };
}

export interface DataPoint {
  x: number;
  y: number;
}

export function parseXYInput(raw: string): DataPoint[] {
  const lines = raw
    .split(/\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const points: DataPoint[] = [];
  for (const line of lines) {
    const parts = line.split(/[,\t]+/).map((s) => s.trim());
    const xStr = parts[0];
    const yStr = parts[1];
    if (xStr === undefined || yStr === undefined) continue;
    const x = Number(xStr);
    const y = Number(yStr);
    if (!isNaN(x) && !isNaN(y)) {
      points.push({ x, y });
    }
  }
  return points;
}
