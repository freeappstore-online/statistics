import { useState, useMemo } from "react";
import { parseDataInput } from "../lib/stats";
import {
  oneSampleZTest,
  oneSampleTTest,
  twoSampleTTest,
  chiSquareGoodnessOfFit,
  type TestResult,
} from "../lib/hypothesis";
import HypothesisChart from "./HypothesisChart";

type TestType = "z-one" | "t-one" | "t-two" | "chi2";

const TEST_LABELS: Record<TestType, string> = {
  "z-one": "One-Sample Z-Test",
  "t-one": "One-Sample T-Test",
  "t-two": "Two-Sample T-Test",
  "chi2": "Chi-Square Goodness of Fit",
};

export default function HypothesisMode() {
  const [testType, setTestType] = useState<TestType>("t-one");
  const [alpha, setAlpha] = useState(0.05);

  // z-test params
  const [zSampleMean, setZSampleMean] = useState(5.2);
  const [zPopMean, setZPopMean] = useState(5);
  const [zPopStddev, setZPopStddev] = useState(1.5);
  const [zN, setZN] = useState(30);

  // t-test one-sample
  const [tData, setTData] = useState("5.1, 4.9, 5.3, 5.0, 4.8, 5.2, 5.1, 4.7, 5.4, 5.0");
  const [tPopMean, setTPopMean] = useState(5);

  // t-test two-sample
  const [t2Data1, setT2Data1] = useState("5.1, 5.3, 4.9, 5.0, 5.2, 5.4, 5.1, 4.8");
  const [t2Data2, setT2Data2] = useState("4.5, 4.7, 4.3, 4.6, 4.8, 4.4, 4.9, 4.2");

  // chi-square
  const [chiObserved, setChiObserved] = useState("20, 15, 25, 18, 22");
  const [chiExpected, setChiExpected] = useState("20, 20, 20, 20, 20");

  const result: TestResult | null = useMemo(() => {
    switch (testType) {
      case "z-one":
        if (zN < 1 || zPopStddev <= 0) return null;
        return oneSampleZTest(zSampleMean, zPopMean, zPopStddev, zN, alpha);
      case "t-one": {
        const data = parseDataInput(tData);
        if (data.length < 2) return null;
        return oneSampleTTest(data, tPopMean, alpha);
      }
      case "t-two": {
        const d1 = parseDataInput(t2Data1);
        const d2 = parseDataInput(t2Data2);
        if (d1.length < 2 || d2.length < 2) return null;
        return twoSampleTTest(d1, d2, alpha);
      }
      case "chi2": {
        const obs = parseDataInput(chiObserved);
        const exp = parseDataInput(chiExpected);
        if (obs.length < 2 || exp.length < 2) return null;
        return chiSquareGoodnessOfFit(obs, exp, alpha);
      }
    }
  }, [
    testType, alpha,
    zSampleMean, zPopMean, zPopStddev, zN,
    tData, tPopMean,
    t2Data1, t2Data2,
    chiObserved, chiExpected,
  ]);

  return (
    <div className="space-y-6">
      {/* Test selector */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(TEST_LABELS) as TestType[]).map((t) => (
          <button
            key={t}
            onClick={() => setTestType(t)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            style={{
              background: testType === t ? "var(--accent)" : "var(--panel)",
              color: testType === t ? "#fff" : "var(--ink)",
              border: `1px solid ${testType === t ? "var(--accent)" : "var(--line)"}`,
            }}
          >
            {TEST_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Alpha */}
      <div className="flex items-center gap-3">
        <label className="text-sm" style={{ color: "var(--muted)" }}>
          Significance level (α):
        </label>
        <input
          type="number"
          value={alpha}
          onChange={(e) => setAlpha(Math.max(0.001, Math.min(0.5, Number(e.target.value))))}
          min={0.001}
          max={0.5}
          step={0.01}
          className="w-20 rounded border px-2 py-1 text-sm font-mono focus:outline-none focus:ring-2"
          style={{
            background: "var(--paper)",
            borderColor: "var(--line)",
            color: "var(--ink)",
          }}
        />
      </div>

      {/* Test-specific inputs */}
      <div
        className="rounded-lg border p-4 space-y-4"
        style={{ borderColor: "var(--line)", background: "var(--panel)" }}
      >
        {testType === "z-one" && (
          <>
            <h3 className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
              One-Sample Z-Test Parameters
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <NumInput label="Sample Mean (x̄)" value={zSampleMean} onChange={setZSampleMean} />
              <NumInput label="Population Mean (μ₀)" value={zPopMean} onChange={setZPopMean} />
              <NumInput label="Population σ" value={zPopStddev} onChange={setZPopStddev} min={0.01} />
              <NumInput label="Sample Size (n)" value={zN} onChange={(v) => setZN(Math.max(1, Math.round(v)))} min={1} step={1} />
            </div>
          </>
        )}
        {testType === "t-one" && (
          <>
            <h3 className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
              One-Sample T-Test
            </h3>
            <div>
              <label className="block text-xs mb-1" style={{ color: "var(--muted)" }}>
                Sample Data
              </label>
              <textarea
                value={tData}
                onChange={(e) => setTData(e.target.value)}
                rows={3}
                className="w-full rounded border px-2 py-1.5 text-sm font-mono focus:outline-none focus:ring-2"
                style={{
                  background: "var(--paper)",
                  borderColor: "var(--line)",
                  color: "var(--ink)",
                }}
              />
            </div>
            <NumInput label="Hypothesized Mean (μ₀)" value={tPopMean} onChange={setTPopMean} />
          </>
        )}
        {testType === "t-two" && (
          <>
            <h3 className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
              Two-Sample T-Test (Welch's)
            </h3>
            <div>
              <label className="block text-xs mb-1" style={{ color: "var(--muted)" }}>
                Sample 1
              </label>
              <textarea
                value={t2Data1}
                onChange={(e) => setT2Data1(e.target.value)}
                rows={2}
                className="w-full rounded border px-2 py-1.5 text-sm font-mono focus:outline-none focus:ring-2"
                style={{
                  background: "var(--paper)",
                  borderColor: "var(--line)",
                  color: "var(--ink)",
                }}
              />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: "var(--muted)" }}>
                Sample 2
              </label>
              <textarea
                value={t2Data2}
                onChange={(e) => setT2Data2(e.target.value)}
                rows={2}
                className="w-full rounded border px-2 py-1.5 text-sm font-mono focus:outline-none focus:ring-2"
                style={{
                  background: "var(--paper)",
                  borderColor: "var(--line)",
                  color: "var(--ink)",
                }}
              />
            </div>
          </>
        )}
        {testType === "chi2" && (
          <>
            <h3 className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
              Chi-Square Goodness of Fit
            </h3>
            <div>
              <label className="block text-xs mb-1" style={{ color: "var(--muted)" }}>
                Observed Frequencies
              </label>
              <input
                value={chiObserved}
                onChange={(e) => setChiObserved(e.target.value)}
                className="w-full rounded border px-2 py-1.5 text-sm font-mono focus:outline-none focus:ring-2"
                style={{
                  background: "var(--paper)",
                  borderColor: "var(--line)",
                  color: "var(--ink)",
                }}
              />
            </div>
            <div>
              <label className="block text-xs mb-1" style={{ color: "var(--muted)" }}>
                Expected Frequencies
              </label>
              <input
                value={chiExpected}
                onChange={(e) => setChiExpected(e.target.value)}
                className="w-full rounded border px-2 py-1.5 text-sm font-mono focus:outline-none focus:ring-2"
                style={{
                  background: "var(--paper)",
                  borderColor: "var(--line)",
                  color: "var(--ink)",
                }}
              />
            </div>
          </>
        )}
      </div>

      {/* Results */}
      {result && (
        <>
          <HypothesisChart result={result} />

          <div
            className="rounded-lg border p-4 space-y-3"
            style={{ borderColor: "var(--line)", background: "var(--panel)" }}
          >
            <h3 className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
              {result.testName} Results
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span style={{ color: "var(--muted)" }}>Test Statistic: </span>
                <span className="font-mono font-semibold" style={{ color: "var(--ink)" }}>
                  {result.testStatistic.toFixed(4)}
                </span>
              </div>
              <div>
                <span style={{ color: "var(--muted)" }}>p-value: </span>
                <span className="font-mono font-semibold" style={{ color: "var(--ink)" }}>
                  {result.pValue < 0.0001
                    ? result.pValue.toExponential(4)
                    : result.pValue.toFixed(6)}
                </span>
              </div>
              {(result.ciLower !== 0 || result.ciUpper !== 0) && (
                <div className="col-span-2">
                  <span style={{ color: "var(--muted)" }}>
                    {((1 - alpha) * 100).toFixed(1)}% CI:{" "}
                  </span>
                  <span className="font-mono font-semibold" style={{ color: "var(--ink)" }}>
                    [{result.ciLower.toFixed(4)}, {result.ciUpper.toFixed(4)}]
                  </span>
                </div>
              )}
            </div>
            <div
              className="rounded-lg px-3 py-2 text-sm font-medium"
              style={{
                background: result.reject
                  ? "var(--error)"
                  : "var(--success)",
                color: "#fff",
              }}
            >
              {result.reject ? "Reject H₀" : "Fail to Reject H₀"}
            </div>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              {result.conclusion}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function NumInput({
  label,
  value,
  onChange,
  min,
  step = 0.1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  step?: number;
}) {
  return (
    <div>
      <label className="block text-xs mb-1" style={{ color: "var(--muted)" }}>
        {label}
      </label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        step={step}
        className="w-full rounded border px-2 py-1.5 text-sm font-mono focus:outline-none focus:ring-2"
        style={{
          background: "var(--paper)",
          borderColor: "var(--line)",
          color: "var(--ink)",
        }}
      />
    </div>
  );
}
