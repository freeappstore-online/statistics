import { useRef, useEffect, useCallback } from "react";
import { setupCanvas, drawAxes, toPixelX, toPixelY } from "../lib/canvas";
import { normalPdf } from "../lib/distributions";
import { tPdf, chiSquarePdf, type TestResult } from "../lib/hypothesis";

interface Props {
  result: TestResult;
}

export default function HypothesisChart({ result }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const setup = setupCanvas(canvas);
    if (!setup) return;
    const { ctx, pad, plotW, plotH, theme } = setup;

    let xMin: number;
    let xMax: number;
    let pdfFn: (x: number) => number;

    if (result.distType === "chi2") {
      const df = result.df ?? 1;
      xMin = 0;
      xMax = Math.max(df + 4 * Math.sqrt(2 * df), result.testStatistic * 1.5, 10);
      pdfFn = (x: number) => chiSquarePdf(x, df);
    } else if (result.distType === "t") {
      const df = result.df ?? 30;
      const spread = df > 3 ? 4 : 5;
      xMin = -spread;
      xMax = spread;
      pdfFn = (x: number) => tPdf(x, df);
    } else {
      xMin = -4;
      xMax = 4;
      pdfFn = (x: number) => normalPdf(x);
    }

    // Make sure test statistic is in view
    if (result.testStatistic < xMin) xMin = result.testStatistic - 1;
    if (result.testStatistic > xMax) xMax = result.testStatistic + 1;

    // Find yMax
    let yMax = 0;
    const steps = 300;
    const dx = (xMax - xMin) / steps;
    for (let i = 0; i <= steps; i++) {
      const x = xMin + i * dx;
      const y = pdfFn(x);
      if (y > yMax) yMax = y;
    }
    yMax *= 1.15;
    if (yMax === 0) yMax = 1;

    drawAxes(ctx, pad, plotW, plotH, xMin, xMax, 0, yMax, theme);

    // Shade critical regions (two-tailed for z and t, right-tail for chi2)
    const criticalColor = theme.error + "33";
    if (result.distType === "chi2") {
      // Right tail shading — shade from test statistic to max for visual
      const shadeSteps = 100;
      const shadeStart = Math.abs(result.testStatistic);
      const shadeDx = (xMax - shadeStart) / shadeSteps;
      if (result.reject) {
        ctx.fillStyle = criticalColor;
        ctx.beginPath();
        ctx.moveTo(
          toPixelX(shadeStart, xMin, xMax, plotW, pad.left),
          toPixelY(0, 0, yMax, plotH, pad.top),
        );
        for (let i = 0; i <= shadeSteps; i++) {
          const x = shadeStart + i * shadeDx;
          const y = pdfFn(x);
          ctx.lineTo(
            toPixelX(x, xMin, xMax, plotW, pad.left),
            toPixelY(y, 0, yMax, plotH, pad.top),
          );
        }
        ctx.lineTo(
          toPixelX(xMax, xMin, xMax, plotW, pad.left),
          toPixelY(0, 0, yMax, plotH, pad.top),
        );
        ctx.closePath();
        ctx.fill();
      }
    } else {
      // Two-tailed shading
      const absT = Math.abs(result.testStatistic);
      if (result.reject) {
        // Left tail
        ctx.fillStyle = criticalColor;
        ctx.beginPath();
        ctx.moveTo(
          toPixelX(xMin, xMin, xMax, plotW, pad.left),
          toPixelY(0, 0, yMax, plotH, pad.top),
        );
        const shadeSteps = 80;
        const shadeDx = (-absT - xMin) / shadeSteps;
        for (let i = 0; i <= shadeSteps; i++) {
          const x = xMin + i * shadeDx;
          const y = pdfFn(x);
          ctx.lineTo(
            toPixelX(x, xMin, xMax, plotW, pad.left),
            toPixelY(y, 0, yMax, plotH, pad.top),
          );
        }
        ctx.lineTo(
          toPixelX(-absT, xMin, xMax, plotW, pad.left),
          toPixelY(0, 0, yMax, plotH, pad.top),
        );
        ctx.closePath();
        ctx.fill();

        // Right tail
        ctx.beginPath();
        ctx.moveTo(
          toPixelX(absT, xMin, xMax, plotW, pad.left),
          toPixelY(0, 0, yMax, plotH, pad.top),
        );
        const shadeDx2 = (xMax - absT) / shadeSteps;
        for (let i = 0; i <= shadeSteps; i++) {
          const x = absT + i * shadeDx2;
          const y = pdfFn(x);
          ctx.lineTo(
            toPixelX(x, xMin, xMax, plotW, pad.left),
            toPixelY(y, 0, yMax, plotH, pad.top),
          );
        }
        ctx.lineTo(
          toPixelX(xMax, xMin, xMax, plotW, pad.left),
          toPixelY(0, 0, yMax, plotH, pad.top),
        );
        ctx.closePath();
        ctx.fill();
      }
    }

    // Draw curve
    ctx.strokeStyle = theme.accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const x = xMin + i * dx;
      const y = pdfFn(x);
      const px = toPixelX(x, xMin, xMax, plotW, pad.left);
      const py = toPixelY(y, 0, yMax, plotH, pad.top);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Draw test statistic marker
    const tsPx = toPixelX(result.testStatistic, xMin, xMax, plotW, pad.left);
    const tsPy = toPixelY(pdfFn(result.testStatistic), 0, yMax, plotH, pad.top);
    const baseY = toPixelY(0, 0, yMax, plotH, pad.top);

    ctx.strokeStyle = result.reject ? theme.error : theme.success;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 3]);
    ctx.beginPath();
    ctx.moveTo(tsPx, baseY);
    ctx.lineTo(tsPx, tsPy);
    ctx.stroke();
    ctx.setLineDash([]);

    // Label
    ctx.fillStyle = result.reject ? theme.error : theme.success;
    ctx.font = 'bold 12px "Manrope", system-ui, sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText(
      `t = ${result.testStatistic.toFixed(3)}`,
      tsPx,
      tsPy - 6,
    );
  }, [result]);

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
