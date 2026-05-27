import { useRef, useEffect, useCallback } from "react";
import { setupCanvas, drawAxes, toPixelX, toPixelY } from "../lib/canvas";
import {
  type DistributionType,
  type DistributionParams,
  evalPdf,
  plotRange,
  isDiscrete,
} from "../lib/distributions";

interface Props {
  type: DistributionType;
  params: DistributionParams[DistributionType];
  /** Shade P(a < X < b). */
  shadeLower?: number;
  shadeUpper?: number;
}

export default function DistributionChart({
  type,
  params,
  shadeLower,
  shadeUpper,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const setup = setupCanvas(canvas);
    if (!setup) return;
    const { ctx, pad, plotW, plotH, theme } = setup;

    const [xMin, xMax] = plotRange(type, params);
    const discrete = isDiscrete(type);

    // Compute y values
    let yMax = 0;
    if (discrete) {
      for (let k = Math.floor(xMin); k <= Math.ceil(xMax); k++) {
        const y = evalPdf(type, params, k);
        if (y > yMax) yMax = y;
      }
    } else {
      const steps = 300;
      const dx = (xMax - xMin) / steps;
      for (let i = 0; i <= steps; i++) {
        const x = xMin + i * dx;
        const y = evalPdf(type, params, x);
        if (y > yMax) yMax = y;
      }
    }
    yMax *= 1.15;
    if (yMax === 0) yMax = 1;

    drawAxes(ctx, pad, plotW, plotH, xMin, xMax, 0, yMax, theme, "x", "P(x)");

    // Draw shaded region
    const hasShade =
      shadeLower !== undefined && shadeUpper !== undefined;
    if (hasShade && !discrete) {
      const sL = Math.max(shadeLower, xMin);
      const sU = Math.min(shadeUpper, xMax);
      const steps = 200;
      const dx = (sU - sL) / steps;
      ctx.fillStyle = theme.accent + "44";
      ctx.beginPath();
      ctx.moveTo(
        toPixelX(sL, xMin, xMax, plotW, pad.left),
        toPixelY(0, 0, yMax, plotH, pad.top),
      );
      for (let i = 0; i <= steps; i++) {
        const x = sL + i * dx;
        const y = evalPdf(type, params, x);
        ctx.lineTo(
          toPixelX(x, xMin, xMax, plotW, pad.left),
          toPixelY(y, 0, yMax, plotH, pad.top),
        );
      }
      ctx.lineTo(
        toPixelX(sU, xMin, xMax, plotW, pad.left),
        toPixelY(0, 0, yMax, plotH, pad.top),
      );
      ctx.closePath();
      ctx.fill();
    }

    // Draw curve / bars
    if (discrete) {
      const barHalfW = Math.max(
        2,
        (plotW / (Math.ceil(xMax) - Math.floor(xMin) + 1)) * 0.35,
      );
      for (let k = Math.floor(xMin); k <= Math.ceil(xMax); k++) {
        const y = evalPdf(type, params, k);
        if (y <= 0) continue;
        const px = toPixelX(k, xMin, xMax, plotW, pad.left);
        const py = toPixelY(y, 0, yMax, plotH, pad.top);
        const py0 = toPixelY(0, 0, yMax, plotH, pad.top);

        const isShaded =
          hasShade && k >= shadeLower && k <= shadeUpper;
        ctx.fillStyle = isShaded ? theme.accent + "88" : theme.accent + "44";
        ctx.fillRect(px - barHalfW, py, barHalfW * 2, py0 - py);
        ctx.strokeStyle = theme.accent;
        ctx.lineWidth = 1;
        ctx.strokeRect(px - barHalfW, py, barHalfW * 2, py0 - py);
      }
    } else {
      const steps = 300;
      const dx = (xMax - xMin) / steps;
      ctx.strokeStyle = theme.accent;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const x = xMin + i * dx;
        const y = evalPdf(type, params, x);
        const px = toPixelX(x, xMin, xMax, plotW, pad.left);
        const py = toPixelY(y, 0, yMax, plotH, pad.top);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
  }, [type, params, shadeLower, shadeUpper]);

  useEffect(() => {
    draw();
    const handleResize = () => draw();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [draw]);

  return (
    <div className="w-full" style={{ height: 300 }}>
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}
