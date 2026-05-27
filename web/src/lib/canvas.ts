/**
 * Canvas chart drawing utilities using FAS design system colors.
 */

export interface ChartTheme {
  ink: string;
  muted: string;
  line: string;
  accent: string;
  paper: string;
  success: string;
  error: string;
  warning: string;
}

function getTheme(): ChartTheme {
  const style = getComputedStyle(document.documentElement);
  return {
    ink: style.getPropertyValue("--ink").trim() || "#1a1a1a",
    muted: style.getPropertyValue("--muted").trim() || "#6b7280",
    line: style.getPropertyValue("--line").trim() || "#e5e7eb",
    accent: style.getPropertyValue("--accent").trim() || "#2563eb",
    paper: style.getPropertyValue("--paper").trim() || "#ffffff",
    success: style.getPropertyValue("--success").trim() || "#16a34a",
    error: style.getPropertyValue("--error").trim() || "#dc2626",
    warning: style.getPropertyValue("--warning").trim() || "#d97706",
  };
}

export interface Padding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

const DEFAULT_PADDING: Padding = { top: 20, right: 20, bottom: 40, left: 60 };

/** Set up a canvas for high-DPI rendering and return the context + dimensions. */
export function setupCanvas(
  canvas: HTMLCanvasElement,
  padding: Padding = DEFAULT_PADDING,
): {
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
  plotW: number;
  plotH: number;
  theme: ChartTheme;
  pad: Padding;
} | null {
  const parent = canvas.parentElement;
  if (!parent) return null;

  const dpr = window.devicePixelRatio || 1;
  const rect = parent.getBoundingClientRect();
  const w = Math.floor(rect.width);
  const h = Math.floor(rect.height);

  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.scale(dpr, dpr);
  const theme = getTheme();

  // Clear
  ctx.fillStyle = theme.paper;
  ctx.fillRect(0, 0, w, h);

  return {
    ctx,
    w,
    h,
    plotW: w - padding.left - padding.right,
    plotH: h - padding.top - padding.bottom,
    theme,
    pad: padding,
  };
}

/** Draw grid lines and axis labels. */
export function drawAxes(
  ctx: CanvasRenderingContext2D,
  pad: Padding,
  plotW: number,
  plotH: number,
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number,
  theme: ChartTheme,
  xLabel?: string,
  yLabel?: string,
): void {
  const font = '12px "Manrope", system-ui, sans-serif';
  ctx.font = font;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  // Grid lines
  const xTicks = niceTickCount(xMin, xMax, 8);
  const yTicks = niceTickCount(yMin, yMax, 6);

  ctx.strokeStyle = theme.line;
  ctx.lineWidth = 1;

  // Horizontal grid lines + y labels
  for (const val of yTicks) {
    const y = pad.top + plotH - ((val - yMin) / (yMax - yMin)) * plotH;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(pad.left + plotW, y);
    ctx.stroke();

    ctx.fillStyle = theme.muted;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText(formatTickLabel(val), pad.left - 8, y);
  }

  // Vertical grid lines + x labels
  for (const val of xTicks) {
    const x = pad.left + ((val - xMin) / (xMax - xMin)) * plotW;
    ctx.beginPath();
    ctx.moveTo(x, pad.top);
    ctx.lineTo(x, pad.top + plotH);
    ctx.stroke();

    ctx.fillStyle = theme.muted;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(formatTickLabel(val), x, pad.top + plotH + 6);
  }

  // Axes border
  ctx.strokeStyle = theme.muted;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad.left, pad.top);
  ctx.lineTo(pad.left, pad.top + plotH);
  ctx.lineTo(pad.left + plotW, pad.top + plotH);
  ctx.stroke();

  // Labels
  if (xLabel) {
    ctx.fillStyle = theme.muted;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(xLabel, pad.left + plotW / 2, pad.top + plotH + 24);
  }
  if (yLabel) {
    ctx.save();
    ctx.translate(14, pad.top + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = theme.muted;
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText(yLabel, 0, 0);
    ctx.restore();
  }
}

/** Generate nice tick values for a range. */
function niceTickCount(min: number, max: number, targetCount: number): number[] {
  if (max === min) return [min];
  const range = max - min;
  const rawStep = range / targetCount;
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const normalized = rawStep / mag;
  let step: number;
  if (normalized <= 1) step = 1 * mag;
  else if (normalized <= 2) step = 2 * mag;
  else if (normalized <= 5) step = 5 * mag;
  else step = 10 * mag;

  const start = Math.ceil(min / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= max + step * 0.001; v += step) {
    ticks.push(v);
  }
  return ticks;
}

function formatTickLabel(val: number): string {
  if (Math.abs(val) >= 1e6) return val.toExponential(1);
  if (Number.isInteger(val)) return String(val);
  // At most 4 decimal places
  const s = val.toFixed(4);
  return s.replace(/\.?0+$/, "");
}

/** Map data coordinate to canvas pixel. */
export function toPixel(
  val: number,
  min: number,
  max: number,
  size: number,
  pad: number,
): number {
  if (max === min) return pad + size / 2;
  return pad + ((val - min) / (max - min)) * size;
}

export function toPixelX(
  val: number,
  xMin: number,
  xMax: number,
  plotW: number,
  padLeft: number,
): number {
  return toPixel(val, xMin, xMax, plotW, padLeft);
}

export function toPixelY(
  val: number,
  yMin: number,
  yMax: number,
  plotH: number,
  padTop: number,
): number {
  // Y is inverted on canvas
  return padTop + plotH - ((val - yMin) / (yMax - yMin)) * plotH;
}
