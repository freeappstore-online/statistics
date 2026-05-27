import { useState, useMemo, useCallback } from "react";
import type { DistributionType, DistributionParams } from "../lib/distributions";
import { distributionStats, evalCdf } from "../lib/distributions";
import DistributionChart from "./DistributionChart";

type ParamsMap = {
  [K in DistributionType]: DistributionParams[K];
};

const DEFAULT_PARAMS: ParamsMap = {
  normal: { mu: 0, sigma: 1 },
  binomial: { n: 20, p: 0.5 },
  poisson: { lambda: 5 },
  uniform: { a: 0, b: 10 },
  exponential: { lambda: 1 },
};

const DIST_LABELS: Record<DistributionType, string> = {
  normal: "Normal",
  binomial: "Binomial",
  poisson: "Poisson",
  uniform: "Uniform",
  exponential: "Exponential",
};

export default function DistributionMode() {
  const [type, setType] = useState<DistributionType>("normal");
  const [params, setParams] = useState<ParamsMap>({ ...DEFAULT_PARAMS });
  const [probMode, setProbMode] = useState<"lt" | "gt" | "between">("lt");
  const [probA, setProbA] = useState(0);
  const [probB, setProbB] = useState(1);

  const currentParams = params[type];

  const info = useMemo(
    () => distributionStats(type, currentParams),
    [type, currentParams],
  );

  const probability = useMemo(() => {
    switch (probMode) {
      case "lt":
        return evalCdf(type, currentParams, probA);
      case "gt":
        return 1 - evalCdf(type, currentParams, probA);
      case "between":
        return evalCdf(type, currentParams, probB) - evalCdf(type, currentParams, probA);
    }
  }, [type, currentParams, probMode, probA, probB]);

  const shadeBounds = useMemo(() => {
    switch (probMode) {
      case "lt":
        return { lower: -Infinity, upper: probA };
      case "gt":
        return { lower: probA, upper: Infinity };
      case "between":
        return { lower: probA, upper: probB };
    }
  }, [probMode, probA, probB]);

  const updateParam = useCallback(
    (key: string, val: number) => {
      setParams((prev) => ({
        ...prev,
        [type]: { ...prev[type], [key]: val },
      }));
    },
    [type],
  );

  return (
    <div className="space-y-6">
      {/* Distribution type selector */}
      <div className="flex flex-wrap gap-2">
        {(Object.keys(DIST_LABELS) as DistributionType[]).map((d) => (
          <button
            key={d}
            onClick={() => setType(d)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            style={{
              background: type === d ? "var(--accent)" : "var(--panel)",
              color: type === d ? "#fff" : "var(--ink)",
              border: `1px solid ${type === d ? "var(--accent)" : "var(--line)"}`,
            }}
          >
            {DIST_LABELS[d]}
          </button>
        ))}
      </div>

      {/* Parameters */}
      <div
        className="rounded-lg border p-4"
        style={{ borderColor: "var(--line)", background: "var(--panel)" }}
      >
        <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--ink)" }}>
          Parameters
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {type === "normal" && (
            <>
              <ParamInput
                label="Mean (μ)"
                value={params.normal.mu}
                onChange={(v) => updateParam("mu", v)}
              />
              <ParamInput
                label="Std Dev (σ)"
                value={params.normal.sigma}
                onChange={(v) => updateParam("sigma", Math.max(0.01, v))}
                min={0.01}
                step={0.1}
              />
            </>
          )}
          {type === "binomial" && (
            <>
              <ParamInput
                label="Trials (n)"
                value={params.binomial.n}
                onChange={(v) => updateParam("n", Math.max(1, Math.round(v)))}
                min={1}
                step={1}
              />
              <ParamInput
                label="Probability (p)"
                value={params.binomial.p}
                onChange={(v) => updateParam("p", Math.max(0, Math.min(1, v)))}
                min={0}
                max={1}
                step={0.01}
              />
            </>
          )}
          {type === "poisson" && (
            <ParamInput
              label="Rate (λ)"
              value={params.poisson.lambda}
              onChange={(v) => updateParam("lambda", Math.max(0.1, v))}
              min={0.1}
              step={0.5}
            />
          )}
          {type === "uniform" && (
            <>
              <ParamInput
                label="Min (a)"
                value={params.uniform.a}
                onChange={(v) => updateParam("a", v)}
              />
              <ParamInput
                label="Max (b)"
                value={params.uniform.b}
                onChange={(v) => updateParam("b", v)}
              />
            </>
          )}
          {type === "exponential" && (
            <ParamInput
              label="Rate (λ)"
              value={params.exponential.lambda}
              onChange={(v) => updateParam("lambda", Math.max(0.01, v))}
              min={0.01}
              step={0.1}
            />
          )}
        </div>
      </div>

      {/* Distribution stats */}
      <div
        className="grid grid-cols-3 gap-px rounded-lg border overflow-hidden"
        style={{ borderColor: "var(--line)", background: "var(--line)" }}
      >
        <StatBox label="Mean" value={info.mean.toFixed(4)} />
        <StatBox label="Variance" value={info.variance.toFixed(4)} />
        <StatBox label="Std Dev" value={info.stddev.toFixed(4)} />
      </div>

      {/* Chart */}
      <DistributionChart
        type={type}
        params={currentParams}
        shadeLower={shadeBounds.lower}
        shadeUpper={shadeBounds.upper}
      />

      {/* Probability calculator */}
      <div
        className="rounded-lg border p-4"
        style={{ borderColor: "var(--line)", background: "var(--panel)" }}
      >
        <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--ink)" }}>
          Probability Calculator
        </h3>
        <div className="flex flex-wrap gap-2 mb-3">
          <button
            onClick={() => setProbMode("lt")}
            className="px-3 py-1 rounded text-sm"
            style={{
              background: probMode === "lt" ? "var(--accent)" : "var(--panel)",
              color: probMode === "lt" ? "#fff" : "var(--ink)",
              border: `1px solid ${probMode === "lt" ? "var(--accent)" : "var(--line)"}`,
            }}
          >
            P(X &lt; a)
          </button>
          <button
            onClick={() => setProbMode("gt")}
            className="px-3 py-1 rounded text-sm"
            style={{
              background: probMode === "gt" ? "var(--accent)" : "var(--panel)",
              color: probMode === "gt" ? "#fff" : "var(--ink)",
              border: `1px solid ${probMode === "gt" ? "var(--accent)" : "var(--line)"}`,
            }}
          >
            P(X &gt; a)
          </button>
          <button
            onClick={() => setProbMode("between")}
            className="px-3 py-1 rounded text-sm"
            style={{
              background: probMode === "between" ? "var(--accent)" : "var(--panel)",
              color: probMode === "between" ? "#fff" : "var(--ink)",
              border: `1px solid ${probMode === "between" ? "var(--accent)" : "var(--line)"}`,
            }}
          >
            P(a &lt; X &lt; b)
          </button>
        </div>
        <div className="flex flex-wrap gap-4 items-end">
          <ParamInput
            label="a"
            value={probA}
            onChange={setProbA}
            step={0.1}
          />
          {probMode === "between" && (
            <ParamInput
              label="b"
              value={probB}
              onChange={setProbB}
              step={0.1}
            />
          )}
          <div className="flex-1 min-w-[120px]">
            <div className="text-xs" style={{ color: "var(--muted)" }}>
              Result
            </div>
            <div
              className="text-lg font-semibold font-mono"
              style={{ color: "var(--accent)" }}
            >
              {probability.toFixed(6)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ParamInput({
  label,
  value,
  onChange,
  min,
  max,
  step = 0.1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
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
        max={max}
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

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 py-2" style={{ background: "var(--panel)" }}>
      <div className="text-xs" style={{ color: "var(--muted)" }}>
        {label}
      </div>
      <div className="text-sm font-semibold font-mono" style={{ color: "var(--ink)" }}>
        {value}
      </div>
    </div>
  );
}
