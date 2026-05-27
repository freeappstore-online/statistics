import { useRef, useEffect, useCallback } from "react";
import { setupCanvas, drawAxes, toPixelX, toPixelY } from "../lib/canvas";

interface Props {
  data: number[];
}

export default function DotPlot({ data }: Props) {
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
    const xMin = dataMin - dataRange * 0.05;
    const xMax = dataMax + dataRange * 0.05;

    // Stack dots at same value
    const DOT_RADIUS = 5;
    const freq = new Map<string, number>();
    const points: Array<{ x: number; stack: number }> = [];
    for (const v of sorted) {
      // Round to avoid floating point uniqueness issues in stacking
      const key = v.toFixed(6);
      const count = freq.get(key) ?? 0;
      freq.set(key, count + 1);
      points.push({ x: v, stack: count });
    }

    const maxStack = Math.max(...Array.from(freq.values()), 1);
    const yMin = 0;
    const yMax = maxStack + 1;

    drawAxes(ctx, pad, plotW, plotH, xMin, xMax, yMin, yMax, theme, "Value", "Count");

    // Draw dots
    ctx.fillStyle = theme.accent;
    for (const pt of points) {
      const px = toPixelX(pt.x, xMin, xMax, plotW, pad.left);
      const py = toPixelY(pt.stack + 0.5, yMin, yMax, plotH, pad.top);
      ctx.beginPath();
      ctx.arc(px, py, DOT_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [data]);

  useEffect(() => {
    draw();
    const handleResize = () => draw();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [draw]);

  return (
    <div className="w-full" style={{ height: 250 }}>
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}
