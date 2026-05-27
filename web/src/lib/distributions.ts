/**
 * Probability distribution math — all from scratch.
 */

// ─── Gamma / Log-Gamma via Lanczos approximation ─────────────────────

const LANCZOS_G = 7;
const LANCZOS_C = [
  0.99999999999980993, 676.5203681218851, -1259.1392167224028,
  771.32342877765313, -176.61502916214059, 12.507343278686905,
  -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
];

export function lnGamma(z: number): number {
  if (z < 0.5) {
    // Reflection formula
    return (
      Math.log(Math.PI / Math.sin(Math.PI * z)) - lnGamma(1 - z)
    );
  }
  z -= 1;
  let x = LANCZOS_C[0]!;
  for (let i = 1; i < LANCZOS_G + 2; i++) {
    x += LANCZOS_C[i]! / (z + i);
  }
  const t = z + LANCZOS_G + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

export function gamma(z: number): number {
  return Math.exp(lnGamma(z));
}

/** Log of n! using log-gamma. */
export function lnFactorial(n: number): number {
  return lnGamma(n + 1);
}

/** Binomial coefficient using log-gamma for large n. */
export function lnCombination(n: number, k: number): number {
  if (k < 0 || k > n) return -Infinity;
  return lnFactorial(n) - lnFactorial(k) - lnFactorial(n - k);
}

// ─── Normal distribution ─────────────────────────────────────────────

/** Standard normal PDF. */
export function normalPdf(x: number, mu = 0, sigma = 1): number {
  if (sigma <= 0) return 0;
  const z = (x - mu) / sigma;
  return Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI));
}

/**
 * Standard normal CDF using rational approximation
 * (Abramowitz & Stegun, formula 7.1.26 via Horner form).
 */
export function normalCdf(x: number, mu = 0, sigma = 1): number {
  if (sigma <= 0) return x >= mu ? 1 : 0;
  const z = (x - mu) / sigma;
  return stdNormalCdf(z);
}

function stdNormalCdf(z: number): number {
  // Use symmetry for negative z
  if (z < 0) return 1 - stdNormalCdf(-z);

  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const t = 1 / (1 + p * z);
  const t2 = t * t;
  const t3 = t2 * t;
  const t4 = t3 * t;
  const t5 = t4 * t;
  const poly = a1 * t + a2 * t2 + a3 * t3 + a4 * t4 + a5 * t5;
  return 1 - poly * Math.exp(-0.5 * z * z);
}

// ─── Binomial distribution ───────────────────────────────────────────

/** Binomial PMF: P(X = k) for X ~ Bin(n, p). */
export function binomialPmf(k: number, n: number, p: number): number {
  if (k < 0 || k > n || !Number.isInteger(k)) return 0;
  if (p === 0) return k === 0 ? 1 : 0;
  if (p === 1) return k === n ? 1 : 0;
  const logProb = lnCombination(n, k) + k * Math.log(p) + (n - k) * Math.log(1 - p);
  return Math.exp(logProb);
}

/** Binomial CDF: P(X <= k). */
export function binomialCdf(k: number, n: number, p: number): number {
  if (k < 0) return 0;
  if (k >= n) return 1;
  let sum = 0;
  for (let i = 0; i <= Math.floor(k); i++) {
    sum += binomialPmf(i, n, p);
  }
  return Math.min(sum, 1);
}

// ─── Poisson distribution ────────────────────────────────────────────

/** Poisson PMF: P(X = k) = e^(-lambda) * lambda^k / k! */
export function poissonPmf(k: number, lambda: number): number {
  if (k < 0 || !Number.isInteger(k) || lambda < 0) return 0;
  if (lambda === 0) return k === 0 ? 1 : 0;
  const logProb = k * Math.log(lambda) - lambda - lnFactorial(k);
  return Math.exp(logProb);
}

/** Poisson CDF: P(X <= k). */
export function poissonCdf(k: number, lambda: number): number {
  if (k < 0) return 0;
  let sum = 0;
  for (let i = 0; i <= Math.floor(k); i++) {
    sum += poissonPmf(i, lambda);
  }
  return Math.min(sum, 1);
}

// ─── Uniform distribution ────────────────────────────────────────────

export function uniformPdf(x: number, a: number, b: number): number {
  if (b <= a) return 0;
  return x >= a && x <= b ? 1 / (b - a) : 0;
}

export function uniformCdf(x: number, a: number, b: number): number {
  if (b <= a) return 0;
  if (x <= a) return 0;
  if (x >= b) return 1;
  return (x - a) / (b - a);
}

// ─── Exponential distribution ────────────────────────────────────────

export function exponentialPdf(x: number, lambda: number): number {
  if (lambda <= 0 || x < 0) return 0;
  return lambda * Math.exp(-lambda * x);
}

export function exponentialCdf(x: number, lambda: number): number {
  if (lambda <= 0 || x < 0) return 0;
  return 1 - Math.exp(-lambda * x);
}

// ─── Distribution types ──────────────────────────────────────────────

export type DistributionType =
  | "normal"
  | "binomial"
  | "poisson"
  | "uniform"
  | "exponential";

export interface DistributionParams {
  normal: { mu: number; sigma: number };
  binomial: { n: number; p: number };
  poisson: { lambda: number };
  uniform: { a: number; b: number };
  exponential: { lambda: number };
}

export interface DistributionInfo {
  mean: number;
  variance: number;
  stddev: number;
}

export function distributionStats(
  type: DistributionType,
  params: DistributionParams[typeof type],
): DistributionInfo {
  switch (type) {
    case "normal": {
      const p = params as DistributionParams["normal"];
      return { mean: p.mu, variance: p.sigma ** 2, stddev: p.sigma };
    }
    case "binomial": {
      const p = params as DistributionParams["binomial"];
      const v = p.n * p.p * (1 - p.p);
      return { mean: p.n * p.p, variance: v, stddev: Math.sqrt(v) };
    }
    case "poisson": {
      const p = params as DistributionParams["poisson"];
      return {
        mean: p.lambda,
        variance: p.lambda,
        stddev: Math.sqrt(p.lambda),
      };
    }
    case "uniform": {
      const p = params as DistributionParams["uniform"];
      const v = (p.b - p.a) ** 2 / 12;
      return { mean: (p.a + p.b) / 2, variance: v, stddev: Math.sqrt(v) };
    }
    case "exponential": {
      const p = params as DistributionParams["exponential"];
      const v = 1 / p.lambda ** 2;
      return { mean: 1 / p.lambda, variance: v, stddev: Math.sqrt(v) };
    }
  }
}

/** Evaluate PDF (or PMF for discrete) at x. */
export function evalPdf(
  type: DistributionType,
  params: DistributionParams[typeof type],
  x: number,
): number {
  switch (type) {
    case "normal": {
      const p = params as DistributionParams["normal"];
      return normalPdf(x, p.mu, p.sigma);
    }
    case "binomial": {
      const p = params as DistributionParams["binomial"];
      return binomialPmf(Math.round(x), p.n, p.p);
    }
    case "poisson": {
      const p = params as DistributionParams["poisson"];
      return poissonPmf(Math.round(x), p.lambda);
    }
    case "uniform": {
      const p = params as DistributionParams["uniform"];
      return uniformPdf(x, p.a, p.b);
    }
    case "exponential": {
      const p = params as DistributionParams["exponential"];
      return exponentialPdf(x, p.lambda);
    }
  }
}

/** Evaluate CDF at x. */
export function evalCdf(
  type: DistributionType,
  params: DistributionParams[typeof type],
  x: number,
): number {
  switch (type) {
    case "normal": {
      const p = params as DistributionParams["normal"];
      return normalCdf(x, p.mu, p.sigma);
    }
    case "binomial": {
      const p = params as DistributionParams["binomial"];
      return binomialCdf(Math.floor(x), p.n, p.p);
    }
    case "poisson": {
      const p = params as DistributionParams["poisson"];
      return poissonCdf(Math.floor(x), p.lambda);
    }
    case "uniform": {
      const p = params as DistributionParams["uniform"];
      return uniformCdf(x, p.a, p.b);
    }
    case "exponential": {
      const p = params as DistributionParams["exponential"];
      return exponentialCdf(x, p.lambda);
    }
  }
}

/** Whether the distribution is discrete (uses bars) or continuous (uses lines). */
export function isDiscrete(type: DistributionType): boolean {
  return type === "binomial" || type === "poisson";
}

/** Reasonable x-range for plotting. */
export function plotRange(
  type: DistributionType,
  params: DistributionParams[typeof type],
): [number, number] {
  const info = distributionStats(type, params);
  switch (type) {
    case "normal": {
      return [info.mean - 4 * info.stddev, info.mean + 4 * info.stddev];
    }
    case "binomial": {
      const p = params as DistributionParams["binomial"];
      return [0, p.n];
    }
    case "poisson": {
      const p = params as DistributionParams["poisson"];
      return [0, Math.max(Math.ceil(p.lambda + 4 * Math.sqrt(p.lambda)), 10)];
    }
    case "uniform": {
      const p = params as DistributionParams["uniform"];
      const pad = (p.b - p.a) * 0.3;
      return [p.a - pad, p.b + pad];
    }
    case "exponential": {
      const p = params as DistributionParams["exponential"];
      return [0, 5 / p.lambda];
    }
  }
}
