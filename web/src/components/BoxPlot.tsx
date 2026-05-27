import { useRef, useEffect, useCallback } from "react";
import { setupCanvas, drawAxes, toPixelX, toPixelY } from "../lib/canvas";
import { median, q1, q3 } from "../lib/stats";

interface Props {
  data: number[];
}

export default function BoxPlot({ data }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const setup = setupCanvas(canvas);
    if (!setup) return;
    const { ctx, pad, plotW, plotH, theme } = setup;

    const sorted = [...data].sort((a, b) => a - b);
    const med = median(data);
    const q1Val = q1(data);
    const q3Val = q3(data);
    const iqrVal = q3Val - q1Val;
    const whiskerLow = Math.max(sorted[0]!, q1Val - 1.5 * iqrVal);
    const whiskerHigh = Math.min(sorted[sorted.length - 1]!, q3Val + 1.5 * iqrVal);

    // Find actual whisker extents (nearest data point within range)
    let actualLow = whiskerLow;
    let actualHigh = whiskerHigh;
    for (const v of sorted) {
      if (v >= whiskerLow) {
        actualLow = v;
        break;
      }
    }
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (sorted[i]! <= whiskerHigh) {
        actualHigh = sorted[i]!;
        break;
      }
    }

    // Outliers
    const outliers = data.filter((v) => v < actualLow || v > actualHigh);

    const dataMin = sorted[0]!;
    const dataMax = sorted[sorted.length - 1]!;
    const dataRange = dataMax - dataMin || 1;
    const xMin = dataMin - dataRange * 0.1;
    const xMax = dataMax + dataRange * 0.1;
    const yMin = 0;
    const yMax = 1;

    drawAxes(ctx, pad, plotW, plotH, xMin, xMax, yMin, yMax, theme, "Value");

    const centerY = toPixelY(0.5, yMin, yMax, plotH, pad.top);
    const boxHalfH = plotH * 0.25;

    // Whisker lines
    ctx.strokeStyle = theme.ink;
    ctx.lineWidth = 2;
    const lowX = toPixelX(actualLow, xMin, xMax, plotW, pad.left);
    const highX = toPixelX(actualHigh, xMin, xMax, plotW, pad.left);
    const q1X = toPixelX(q1Val, xMin, xMax, plotW, pad.left);
    const q3X = toPixelX(q3Val, xMin, xMax, plotW, pad.left);
    const medX = toPixelX(med, xMin, xMax, plotW, pad.left);

    // Whisker left
    ctx.beginPath();
    ctx.moveTo(lowX, centerY);
    ctx.lineTo(q1X, centerY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(lowX, centerY - boxHalfH * 0.4);
    ctx.lineTo(lowX, centerY + boxHalfH * 0.4);
    ctx.stroke();

    // Whisker right
    ctx.beginPath();
    ctx.moveTo(q3X, centerY);
    ctx.lineTo(highX, centerY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(highX, centerY - boxHalfH * 0.4);
    ctx.lineTo(highX, centerY + boxHalfH * 0.4);
    ctx.stroke();

    // Box
    ctx.fillStyle = theme.accent + "44";
    ctx.fillRect(q1X, centerY - boxHalfH, q3X - q1X, boxHalfH * 2);
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 2;
    ctx.strokeRect(q1X, centerY - boxHalfH, q3X - q1X, boxHalfH * 2);

    // Median line
    ctx.strokeStyle = theme.ink;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(medX, centerY - boxHalfH);
    ctx.lineTo(medX, centerY + boxHalfH);
    ctx.stroke();

    // Outliers
    ctx.fillStyle = theme.error;
    for (const v of outliers) {
      const ox = toPixelX(v, xMin, xMax, plotW, pad.left);
      ctx.beginPath();
      ctx.arc(ox, centerY, 4, 0, Math.PI * 2);
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
    <div className="w-full" style={{ height: 200 }}>
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}
