import { useState, useMemo } from "react";
import { parseDataInput, computeDescriptive } from "../lib/stats";
import Histogram from "./Histogram";
import BoxPlot from "./BoxPlot";
import DotPlot from "./DotPlot";

const SAMPLE_DATA = "12, 15, 18, 22, 22, 25, 27, 30, 31, 33, 35, 38, 40, 42, 45, 48, 50, 55, 60, 65";

export default function DescriptiveMode() {
  const [input, setInput] = useState(SAMPLE_DATA);
  const [binCount, setBinCount] = useState(8);

  const data = useMemo(() => parseDataInput(input), [input]);
  const stats = useMemo(
    () => (data.length > 0 ? computeDescriptive(data) : null),
    [data],
  );

  return (
    <div className="space-y-6">
      {/* Input */}
      <div>
        <label
          className="block text-sm font-semibold mb-1"
          style={{ color: "var(--ink)" }}
        >
          Data (comma-separated or one per line)
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={4}
          className="w-full rounded-lg border px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2"
          style={{
            background: "var(--panel)",
            borderColor: "var(--line)",
            color: "var(--ink)",
          }}
          placeholder="e.g. 10, 20, 30, 40"
        />
        <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
          {data.length} valid number{data.length !== 1 ? "s" : ""} parsed
        </p>
      </div>

      {stats && (
        <>
          {/* Stats table */}
          <div
            className="rounded-lg border overflow-hidden"
            style={{ borderColor: "var(--line)" }}
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-px" style={{ background: "var(--line)" }}>
              <StatCell label="Count" value={stats.count} />
              <StatCell label="Mean" value={stats.mean.toFixed(4)} />
              <StatCell label="Median" value={stats.median.toFixed(4)} />
              <StatCell
                label="Mode"
                value={
                  stats.mode.length === 0
                    ? "None"
                    : stats.mode.map((v) => v.toFixed(2)).join(", ")
                }
              />
              <StatCell label="Std Dev" value={stats.stddev.toFixed(4)} />
              <StatCell label="Variance" value={stats.variance.toFixed(4)} />
              <StatCell label="Min" value={stats.min.toFixed(4)} />
              <StatCell label="Max" value={stats.max.toFixed(4)} />
              <StatCell label="Range" value={stats.range.toFixed(4)} />
              <StatCell label="Q1" value={stats.q1.toFixed(4)} />
              <StatCell label="Q3" value={stats.q3.toFixed(4)} />
              <StatCell label="IQR" value={stats.iqr.toFixed(4)} />
              <StatCell label="Skewness" value={stats.skewness.toFixed(4)} />
              <StatCell label="Kurtosis" value={stats.kurtosis.toFixed(4)} />
            </div>
          </div>

          {/* Charts */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
                  Histogram
                </h3>
                <label className="flex items-center gap-2 text-xs" style={{ color: "var(--muted)" }}>
                  Bins:
                  <input
                    type="range"
                    min={2}
                    max={30}
                    value={binCount}
                    onChange={(e) => setBinCount(Number(e.target.value))}
                    className="w-24"
                  />
                  <span className="w-5 text-right">{binCount}</span>
                </label>
              </div>
              <Histogram data={data} binCount={binCount} />
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--ink)" }}>
                Box Plot
              </h3>
              <BoxPlot data={data} />
            </div>

            <div>
              <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--ink)" }}>
                Dot Plot
              </h3>
              <DotPlot data={data} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCell({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="px-3 py-2" style={{ background: "var(--panel)" }}>
      <div className="text-xs" style={{ color: "var(--muted)" }}>
        {label}
      </div>
      <div
        className="text-sm font-semibold font-mono truncate"
        style={{ color: "var(--ink)" }}
        title={String(value)}
      >
        {value}
      </div>
    </div>
  );
}
