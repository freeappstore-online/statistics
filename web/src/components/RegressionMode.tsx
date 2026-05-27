import { useState, useMemo } from "react";
import { parseXYInput, linearRegression } from "../lib/regression";
import ScatterPlot from "./ScatterPlot";

const SAMPLE_DATA = `1, 2
2, 4.1
3, 5.9
4, 8.2
5, 9.8
6, 12.1
7, 14.3
8, 15.9
9, 18.1
10, 20.2`;

export default function RegressionMode() {
  const [input, setInput] = useState(SAMPLE_DATA);
  const [showResiduals, setShowResiduals] = useState(false);
  const [addX, setAddX] = useState("");
  const [addY, setAddY] = useState("");

  const points = useMemo(() => parseXYInput(input), [input]);
  const regression = useMemo(() => {
    if (points.length < 2) return null;
    return linearRegression(
      points.map((p) => p.x),
      points.map((p) => p.y),
    );
  }, [points]);

  const handleAddPoint = () => {
    const x = Number(addX);
    const y = Number(addY);
    if (isNaN(x) || isNaN(y)) return;
    setInput((prev) => prev.trim() + `\n${x}, ${y}`);
    setAddX("");
    setAddY("");
  };

  return (
    <div className="space-y-6">
      {/* Input */}
      <div>
        <label
          className="block text-sm font-semibold mb-1"
          style={{ color: "var(--ink)" }}
        >
          Data Points (x, y per line)
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={6}
          className="w-full rounded-lg border px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2"
          style={{
            background: "var(--panel)",
            borderColor: "var(--line)",
            color: "var(--ink)",
          }}
          placeholder={"1, 2\n2, 4\n3, 6"}
        />
        <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
          {points.length} point{points.length !== 1 ? "s" : ""} parsed
        </p>
      </div>

      {/* Add point form */}
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs mb-1" style={{ color: "var(--muted)" }}>
            x
          </label>
          <input
            type="number"
            value={addX}
            onChange={(e) => setAddX(e.target.value)}
            className="w-24 rounded border px-2 py-1.5 text-sm font-mono focus:outline-none focus:ring-2"
            style={{
              background: "var(--paper)",
              borderColor: "var(--line)",
              color: "var(--ink)",
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddPoint();
            }}
          />
        </div>
        <div>
          <label className="block text-xs mb-1" style={{ color: "var(--muted)" }}>
            y
          </label>
          <input
            type="number"
            value={addY}
            onChange={(e) => setAddY(e.target.value)}
            className="w-24 rounded border px-2 py-1.5 text-sm font-mono focus:outline-none focus:ring-2"
            style={{
              background: "var(--paper)",
              borderColor: "var(--line)",
              color: "var(--ink)",
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddPoint();
            }}
          />
        </div>
        <button
          onClick={handleAddPoint}
          className="px-4 py-1.5 rounded-lg text-sm font-medium"
          style={{
            background: "var(--accent)",
            color: "#fff",
          }}
        >
          Add Point
        </button>
      </div>

      {/* Scatter plot */}
      {points.length > 0 && (
        <ScatterPlot
          points={points}
          regression={regression}
          showResiduals={showResiduals}
        />
      )}

      {/* Regression results */}
      {regression && (
        <div
          className="rounded-lg border p-4 space-y-3"
          style={{ borderColor: "var(--line)", background: "var(--panel)" }}
        >
          <h3 className="text-sm font-semibold" style={{ color: "var(--ink)" }}>
            Linear Regression
          </h3>
          <div
            className="text-lg font-mono font-semibold"
            style={{ color: "var(--accent)" }}
          >
            {regression.equation}
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span style={{ color: "var(--muted)" }}>Slope: </span>
              <span className="font-mono font-semibold" style={{ color: "var(--ink)" }}>
                {regression.slope.toFixed(6)}
              </span>
            </div>
            <div>
              <span style={{ color: "var(--muted)" }}>Intercept: </span>
              <span className="font-mono font-semibold" style={{ color: "var(--ink)" }}>
                {regression.intercept.toFixed(6)}
              </span>
            </div>
            <div>
              <span style={{ color: "var(--muted)" }}>R²: </span>
              <span className="font-mono font-semibold" style={{ color: "var(--ink)" }}>
                {regression.rSquared.toFixed(6)}
              </span>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: "var(--ink)" }}>
            <input
              type="checkbox"
              checked={showResiduals}
              onChange={(e) => setShowResiduals(e.target.checked)}
              className="rounded"
            />
            Show residuals
          </label>
        </div>
      )}
    </div>
  );
}
