import { useState } from "react";
import DescriptiveMode from "./components/DescriptiveMode";
import DistributionMode from "./components/DistributionMode";
import RegressionMode from "./components/RegressionMode";
import HypothesisMode from "./components/HypothesisMode";

type Mode = "descriptive" | "distributions" | "regression" | "hypothesis";

const MODES: { key: Mode; label: string; icon: string }[] = [
  { key: "descriptive", label: "Descriptive", icon: "bar_chart" },
  { key: "distributions", label: "Distributions", icon: "show_chart" },
  { key: "regression", label: "Regression", icon: "scatter_plot" },
  { key: "hypothesis", label: "Hypothesis", icon: "science" },
];

export default function App() {
  const [mode, setMode] = useState<Mode>("descriptive");

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--paper)", color: "var(--ink)" }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-10 border-b backdrop-blur-md"
        style={{
          borderColor: "var(--line)",
          background: "var(--glass)",
        }}
      >
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1
            className="text-lg font-bold"
            style={{ fontFamily: '"Fraunces", serif' }}
          >
            Statistics
          </h1>
          <span className="text-xs" style={{ color: "var(--muted)" }}>
            FreeAppStore
          </span>
        </div>
      </header>

      {/* Mode tabs */}
      <nav
        className="border-b"
        style={{ borderColor: "var(--line)" }}
      >
        <div className="max-w-4xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {MODES.map((m) => (
            <button
              key={m.key}
              onClick={() => setMode(m.key)}
              className="flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors relative"
              style={{
                color: mode === m.key ? "var(--accent)" : "var(--muted)",
              }}
            >
              {m.label}
              {mode === m.key && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                  style={{ background: "var(--accent)" }}
                />
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
        {mode === "descriptive" && <DescriptiveMode />}
        {mode === "distributions" && <DistributionMode />}
        {mode === "regression" && <RegressionMode />}
        {mode === "hypothesis" && <HypothesisMode />}
      </main>

      {/* Footer */}
      <footer
        className="border-t py-4 text-center text-xs"
        style={{
          borderColor: "var(--line)",
          color: "var(--muted)",
        }}
      >
        All math computed from scratch in TypeScript. No external math libraries.
      </footer>
    </div>
  );
}
