/**
 * Hypothesis testing — from scratch.
 * Implements: one-sample z-test, one-sample t-test, two-sample t-test,
 * chi-square goodness of fit.
 */

import { normalCdf, lnGamma } from "./distributions";

// ─── t-distribution CDF via regularized incomplete beta ──────────────

/**
 * Regularized incomplete beta function I_x(a, b) using continued fraction.
 * Used for computing t-distribution and chi-square CDFs.
 */
function regularizedBeta(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;

  // Use symmetry relation when x > (a+1)/(a+b+2)
  if (x > (a + 1) / (a + b + 2)) {
    return 1 - regularizedBeta(1 - x, b, a);
  }

  const lnPrefix =
    a * Math.log(x) + b * Math.log(1 - x) - Math.log(a) -
    (lnGamma(a) + lnGamma(b) - lnGamma(a + b));
  const prefix = Math.exp(lnPrefix);

  // Lentz's continued fraction
  const maxIter = 200;
  const eps = 1e-14;
  let c = 1;
  let d = 1 - ((a + b) * x) / (a + 1);
  if (Math.abs(d) < 1e-30) d = 1e-30;
  d = 1 / d;
  let h = d;

  for (let m = 1; m <= maxIter; m++) {
    // Even step
    const m2 = 2 * m;
    let num = (m * (b - m) * x) / ((a + m2 - 1) * (a + m2));
    d = 1 + num * d;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = 1 + num / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    h *= d * c;

    // Odd step
    num = -((a + m) * (a + b + m) * x) / ((a + m2) * (a + m2 + 1));
    d = 1 + num * d;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = 1 + num / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    const delta = d * c;
    h *= delta;

    if (Math.abs(delta - 1) < eps) break;
  }

  return prefix * h;
}

/** CDF of t-distribution with df degrees of freedom. */
export function tCdf(t: number, df: number): number {
  if (df <= 0) return 0;
  const x = df / (df + t * t);
  const ibeta = regularizedBeta(x, df / 2, 0.5);
  if (t >= 0) {
    return 1 - 0.5 * ibeta;
  } else {
    return 0.5 * ibeta;
  }
}

/** CDF of chi-square distribution with df degrees of freedom. */
export function chiSquareCdf(x: number, df: number): number {
  if (x <= 0 || df <= 0) return 0;
  // Chi-square CDF = regularized lower incomplete gamma P(df/2, x/2)
  return regularizedGammaP(df / 2, x / 2);
}

/** Regularized lower incomplete gamma function P(a, x). */
function regularizedGammaP(a: number, x: number): number {
  if (x < 0) return 0;
  if (x === 0) return 0;

  if (x < a + 1) {
    // Series representation
    let sum = 1 / a;
    let term = 1 / a;
    for (let n = 1; n < 200; n++) {
      term *= x / (a + n);
      sum += term;
      if (Math.abs(term) < Math.abs(sum) * 1e-14) break;
    }
    return sum * Math.exp(-x + a * Math.log(x) - lnGamma(a));
  } else {
    // Continued fraction for upper incomplete gamma, then 1 - Q
    return 1 - regularizedGammaQ(a, x);
  }
}

function regularizedGammaQ(a: number, x: number): number {
  // Continued fraction (Lentz)
  let b0 = x + 1 - a;
  let c = 1e30;
  let d = b0 === 0 ? 1e30 : 1 / b0;
  let h = d;

  for (let i = 1; i < 200; i++) {
    const an = -i * (i - a);
    const bn = x + 2 * i + 1 - a;
    d = bn + an * d;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = bn + an / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    const delta = d * c;
    h *= delta;
    if (Math.abs(delta - 1) < 1e-14) break;
  }

  return Math.exp(-x + a * Math.log(x) - lnGamma(a)) * h;
}

/** Chi-square PDF for visualization. */
export function chiSquarePdf(x: number, df: number): number {
  if (x <= 0 || df <= 0) return 0;
  const k2 = df / 2;
  return Math.exp(
    (k2 - 1) * Math.log(x) - x / 2 - k2 * Math.log(2) - lnGamma(k2),
  );
}

/** t-distribution PDF for visualization. */
export function tPdf(t: number, df: number): number {
  if (df <= 0) return 0;
  const coeff = Math.exp(
    lnGamma((df + 1) / 2) - lnGamma(df / 2),
  ) / Math.sqrt(df * Math.PI);
  return coeff * Math.pow(1 + (t * t) / df, -(df + 1) / 2);
}

// ─── Test result interface ───────────────────────────────────────────

export interface TestResult {
  testStatistic: number;
  pValue: number;
  ciLower: number;
  ciUpper: number;
  reject: boolean;
  alpha: number;
  testName: string;
  conclusion: string;
  /** Type of distribution for visualization */
  distType: "z" | "t" | "chi2";
  df?: number;
}

// ─── One-sample z-test ───────────────────────────────────────────────

export function oneSampleZTest(
  sampleMean: number,
  popMean: number,
  popStddev: number,
  n: number,
  alpha: number,
): TestResult {
  const se = popStddev / Math.sqrt(n);
  const z = (sampleMean - popMean) / se;
  const pValue = 2 * (1 - normalCdf(Math.abs(z)));

  // CI for the mean
  const zCrit = zCritical(alpha);
  const ciLower = sampleMean - zCrit * se;
  const ciUpper = sampleMean + zCrit * se;

  return {
    testStatistic: z,
    pValue,
    ciLower,
    ciUpper,
    reject: pValue < alpha,
    alpha,
    testName: "One-Sample Z-Test",
    conclusion: pValue < alpha
      ? `Reject H₀ at α = ${alpha}. There is sufficient evidence that the population mean differs from ${popMean}.`
      : `Fail to reject H₀ at α = ${alpha}. There is insufficient evidence that the population mean differs from ${popMean}.`,
    distType: "z",
  };
}

/** Approximate z critical value for two-tailed test. */
function zCritical(alpha: number): number {
  // Rational approximation for inverse normal (Beasley-Springer-Moro)
  const p = 1 - alpha / 2;
  return inverseCdfApprox(p);
}

function inverseCdfApprox(p: number): number {
  // Rational approximation for the inverse of the standard normal CDF.
  // Based on Peter Acklam's algorithm.
  const a = [
    -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2,
    1.383577518672690e2, -3.066479806614716e1, 2.506628277459239e0,
  ];
  const b = [
    -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2,
    6.680131188771972e1, -1.328068155288572e1,
  ];
  const c = [
    -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838e0,
    -2.549732539343734e0, 4.374664141464968e0, 2.938163982698783e0,
  ];
  const d = [
    7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996e0,
    3.754408661907416e0,
  ];

  const pLow = 0.02425;
  const pHigh = 1 - pLow;

  let q: number;
  let r: number;

  if (p < pLow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (
      (((((c[0]! * q + c[1]!) * q + c[2]!) * q + c[3]!) * q + c[4]!) * q + c[5]!) /
      ((((d[0]! * q + d[1]!) * q + d[2]!) * q + d[3]!) * q + 1)
    );
  } else if (p <= pHigh) {
    q = p - 0.5;
    r = q * q;
    return (
      ((((((a[0]! * r + a[1]!) * r + a[2]!) * r + a[3]!) * r + a[4]!) * r + a[5]!) * q) /
      (((((b[0]! * r + b[1]!) * r + b[2]!) * r + b[3]!) * r + b[4]!) * r + 1)
    );
  } else {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return -(
      (((((c[0]! * q + c[1]!) * q + c[2]!) * q + c[3]!) * q + c[4]!) * q + c[5]!) /
      ((((d[0]! * q + d[1]!) * q + d[2]!) * q + d[3]!) * q + 1)
    );
  }
}

// ─── One-sample t-test ───────────────────────────────────────────────

export function oneSampleTTest(
  data: number[],
  popMean: number,
  alpha: number,
): TestResult {
  const n = data.length;
  if (n < 2) {
    return {
      testStatistic: 0,
      pValue: 1,
      ciLower: 0,
      ciUpper: 0,
      reject: false,
      alpha,
      testName: "One-Sample T-Test",
      conclusion: "Need at least 2 data points.",
      distType: "t",
      df: 0,
    };
  }

  const mean = data.reduce((s, v) => s + v, 0) / n;
  const s = Math.sqrt(
    data.reduce((acc, v) => acc + (v - mean) ** 2, 0) / (n - 1),
  );
  const se = s / Math.sqrt(n);
  const t = se === 0 ? 0 : (mean - popMean) / se;
  const df = n - 1;
  const pValue = 2 * (1 - tCdf(Math.abs(t), df));

  // CI using t-critical (approximation via inverse t)
  const tCrit = inverseTApprox(1 - alpha / 2, df);
  const ciLower = mean - tCrit * se;
  const ciUpper = mean + tCrit * se;

  return {
    testStatistic: t,
    pValue,
    ciLower,
    ciUpper,
    reject: pValue < alpha,
    alpha,
    testName: "One-Sample T-Test",
    conclusion: pValue < alpha
      ? `Reject H₀ at α = ${alpha}. There is sufficient evidence that the population mean differs from ${popMean}.`
      : `Fail to reject H₀ at α = ${alpha}. There is insufficient evidence that the population mean differs from ${popMean}.`,
    distType: "t",
    df,
  };
}

/** Approximate inverse t-distribution CDF. Uses normal approximation with correction. */
function inverseTApprox(p: number, df: number): number {
  // Approximation: for large df, t ~ z; for small df, use Cornish-Fisher expansion.
  const z = inverseCdfApprox(p);
  if (df >= 30) return z;
  // Cornish-Fisher expansion terms
  const g1 = (z * z * z + z) / (4 * df);
  const g2 =
    (5 * z * z * z * z * z + 16 * z * z * z + 3 * z) / (96 * df * df);
  return z + g1 + g2;
}

// ─── Two-sample t-test (Welch's) ────────────────────────────────────

export function twoSampleTTest(
  data1: number[],
  data2: number[],
  alpha: number,
): TestResult {
  const n1 = data1.length;
  const n2 = data2.length;
  if (n1 < 2 || n2 < 2) {
    return {
      testStatistic: 0,
      pValue: 1,
      ciLower: 0,
      ciUpper: 0,
      reject: false,
      alpha,
      testName: "Two-Sample T-Test (Welch's)",
      conclusion: "Need at least 2 data points in each sample.",
      distType: "t",
      df: 0,
    };
  }

  const mean1 = data1.reduce((s, v) => s + v, 0) / n1;
  const mean2 = data2.reduce((s, v) => s + v, 0) / n2;
  const s1sq = data1.reduce((acc, v) => acc + (v - mean1) ** 2, 0) / (n1 - 1);
  const s2sq = data2.reduce((acc, v) => acc + (v - mean2) ** 2, 0) / (n2 - 1);

  const se = Math.sqrt(s1sq / n1 + s2sq / n2);
  const t = se === 0 ? 0 : (mean1 - mean2) / se;

  // Welch-Satterthwaite degrees of freedom
  const num = (s1sq / n1 + s2sq / n2) ** 2;
  const denom =
    (s1sq / n1) ** 2 / (n1 - 1) + (s2sq / n2) ** 2 / (n2 - 1);
  const df = denom === 0 ? 1 : num / denom;

  const pValue = 2 * (1 - tCdf(Math.abs(t), df));

  const tCrit = inverseTApprox(1 - alpha / 2, df);
  const diff = mean1 - mean2;
  const ciLower = diff - tCrit * se;
  const ciUpper = diff + tCrit * se;

  return {
    testStatistic: t,
    pValue,
    ciLower,
    ciUpper,
    reject: pValue < alpha,
    alpha,
    testName: "Two-Sample T-Test (Welch's)",
    conclusion: pValue < alpha
      ? `Reject H₀ at α = ${alpha}. There is sufficient evidence that the two population means differ.`
      : `Fail to reject H₀ at α = ${alpha}. There is insufficient evidence that the two population means differ.`,
    distType: "t",
    df,
  };
}

// ─── Chi-square goodness of fit ──────────────────────────────────────

export function chiSquareGoodnessOfFit(
  observed: number[],
  expected: number[],
  alpha: number,
): TestResult {
  const n = Math.min(observed.length, expected.length);
  if (n < 2) {
    return {
      testStatistic: 0,
      pValue: 1,
      ciLower: 0,
      ciUpper: 0,
      reject: false,
      alpha,
      testName: "Chi-Square Goodness of Fit",
      conclusion: "Need at least 2 categories.",
      distType: "chi2",
      df: 0,
    };
  }

  let chi2 = 0;
  for (let i = 0; i < n; i++) {
    const o = observed[i]!;
    const e = expected[i]!;
    if (e > 0) {
      chi2 += (o - e) ** 2 / e;
    }
  }

  const df = n - 1;
  const pValue = 1 - chiSquareCdf(chi2, df);

  return {
    testStatistic: chi2,
    pValue,
    ciLower: 0,
    ciUpper: 0,
    reject: pValue < alpha,
    alpha,
    testName: "Chi-Square Goodness of Fit",
    conclusion: pValue < alpha
      ? `Reject H₀ at α = ${alpha}. The observed frequencies differ significantly from the expected frequencies.`
      : `Fail to reject H₀ at α = ${alpha}. The observed frequencies do not differ significantly from the expected frequencies.`,
    distType: "chi2",
    df,
  };
}
