import { useRef, useEffect, useCallback } from "react";
import { setupCanvas, drawAxes, toPixelX, toPixelY } from "../lib/canvas";

interface Props {
  data: number[];
  binCount: number;
}

export default function Histogram({ data, binCount }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const setup = setupCanvas(canvas);
    if (!setup) return;
    const { ctx, pad, plotW, plotH, theme } = setup;

    const sorted = [...data].sort((a, b) => a - b);
    const dataMin = sorted[0]!;
    const dataMax = sorted[sorted.length - 1]!;
    const dataRange = dataMax - dataMin || 1;
    const bins = Math.max(1, binCount);
    const binWidth = dataRange / bins;

    // Build histogram
    const counts: number[] = new Array(bins).fill(0) as number[];
    for (const v of data) {
      let idx = Math.floor((v - dataMin) / binWidth);
      if (idx >= bins) idx = bins - 1;
      if (idx < 0) idx = 0;
      counts[idx] = (counts[idx] ?? 0) + 1;
    }

    const maxCount = Math.max(...counts, 1);
    const xMin = dataMin;
    const xMax = dataMin + bins * binWidth;
    const yMin = 0;
    const yMax = maxCount * 1.1;

    drawAxes(ctx, pad, plotW, plotH, xMin, xMax, yMin, yMax, theme, "Value", "Frequency");

    // Draw bars
    ctx.fillStyle = theme.accent + "66";
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 1;
    for (let i = 0; i < bins; i++) {
      const barXMin = dataMin + i * binWidth;
      const barXMax = barXMin + binWidth;
      const count = counts[i] ?? 0;
      const x1 = toPixelX(barXMin, xMin, xMax, plotW, pad.left);
      const x2 = toPixelX(barXMax, xMin, xMax, plotW, pad.left);
      const y1 = toPixelY(count, yMin, yMax, plotH, pad.top);
      const y2 = toPixelY(0, yMin, yMax, plotH, pad.top);
      ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
    }
  }, [data, binCount]);

  useEffect(() => {
    draw();
    const handleResize = () => draw();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [draw]);

  return (
    <div className="w-full" style={{ height: 280 }}>
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}
