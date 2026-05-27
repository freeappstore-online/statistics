import { useRef, useEffect, useCallback } from "react";
import { setupCanvas, drawAxes, toPixelX, toPixelY } from "../lib/canvas";
import type { DataPoint } from "../lib/regression";
import type { RegressionResult } from "../lib/regression";

interface Props {
  points: DataPoint[];
  regression: RegressionResult | null;
  showResiduals: boolean;
}

export default function ScatterPlot({ points, regression, showResiduals }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || points.length === 0) return;

    const setup = setupCanvas(canvas);
    if (!setup) return;
    const { ctx, pad, plotW, plotH, theme } = setup;

    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const xMin = Math.min(...xs);
    const xMax = Math.max(...xs);
    const yMin = Math.min(...ys);
    const yMax = Math.max(...ys);
    const xRange = xMax - xMin || 1;
    const yRange = yMax - yMin || 1;
    const xPad = xRange * 0.1;
    const yPad = yRange * 0.1;
    const axXMin = xMin - xPad;
    const axXMax = xMax + xPad;
    const axYMin = yMin - yPad;
    const axYMax = yMax + yPad;

    drawAxes(ctx, pad, plotW, plotH, axXMin, axXMax, axYMin, axYMax, theme, "x", "y");

    // Regression line
    if (regression) {
      ctx.strokeStyle = theme.accent;
      ctx.lineWidth = 2;
      ctx.beginPath();
      const lineX1 = axXMin;
      const lineX2 = axXMax;
      const lineY1 = regression.slope * lineX1 + regression.intercept;
      const lineY2 = regression.slope * lineX2 + regression.intercept;
      ctx.moveTo(
        toPixelX(lineX1, axXMin, axXMax, plotW, pad.left),
        toPixelY(lineY1, axYMin, axYMax, plotH, pad.top),
      );
      ctx.lineTo(
        toPixelX(lineX2, axXMin, axXMax, plotW, pad.left),
        toPixelY(lineY2, axYMin, axYMax, plotH, pad.top),
      );
      ctx.stroke();

      // Residuals
      if (showResiduals) {
        ctx.strokeStyle = theme.error + "88";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        for (const pt of points) {
          const yPred = regression.slope * pt.x + regression.intercept;
          const px = toPixelX(pt.x, axXMin, axXMax, plotW, pad.left);
          const py = toPixelY(pt.y, axYMin, axYMax, plotH, pad.top);
          const pyPred = toPixelY(yPred, axYMin, axYMax, plotH, pad.top);
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px, pyPred);
          ctx.stroke();
        }
        ctx.setLineDash([]);
      }
    }

    // Points
    ctx.fillStyle = theme.accent;
    for (const pt of points) {
      const px = toPixelX(pt.x, axXMin, axXMax, plotW, pad.left);
      const py = toPixelY(pt.y, axYMin, axYMax, plotH, pad.top);
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [points, regression, showResiduals]);

  useEffect(() => {
    draw();
    const handleResize = () => draw();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [draw]);

  return (
    <div className="w-full" style={{ height: 320 }}>
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}
