// Cloud-bow LUT Explorer (GitHub Pages-safe, no build step)
//
// Data format:
// - grid_*.json: { reff_um[], veff[], theta_deg[], shape:[R,V,3,T], dtype:'float32', order:'C' }
// - lut_*.bin  : Float32Array of shape (R,V,3,T) flattened in C-order.
//
// Interpolation:
// - bilinear in (reff, veff)
// - reff interpolation can be linear-in-reff or linear-in-log(reff) (toggle)
//
// DSD visualization:
// Hansen/Pörtge gamma DSD: n(r) ∝ r^{(1-3v)/v} exp(-r/(reff*v))
// equivalently Gamma(k, theta) with k = 1/v - 2, theta = reff*v

const state = {
  // selection
  reff: 7.96,
  veff: 0.08,
  channel: 1, // 0=R,1=G,2=B
  logX: true,
  logInterp: true,
  multi: false,

  // pinned selections (for multi mode)
  pinned: [], // {reff, veff, color}

  // LUT data
  loaded: false,
  name: "small",
  reffArr: null,
  veffArr: null,
  thetaArr: null,
  shape: null,
  data: null, // Float32Array
};

const palette = [
  "#8ab4ff", "#ff9b9b", "#88ffb8", "#ffd36e", "#c1a3ff",
  "#7ef3ff", "#ff86df", "#b4ff7a", "#ffa86a", "#a0d0ff",
];
const currentColor = "#ff7a45";
let bubbleAnimationTimer = null;
let bubbleParticles = [];
let bubbleSignature = "";
let bubbleLastTime = 0;

const layoutState = {
  colRatios: [0.5, 0.5],
  rowRatio: 0.5,
  userRowRatio: null,
};

function clamp(x, lo, hi){ return Math.min(Math.max(x, lo), hi); }

function fmt(x, n=4){ return Number(x).toFixed(n); }

function setStatus(msg){ document.getElementById("status").textContent = msg; }

function computedTheme(){
  const setting = localStorage.getItem("theme") || "system";
  if (setting === "light" || setting === "dark") return setting;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(){
  document.documentElement.setAttribute("data-theme", computedTheme());
}

function cssVar(name){
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function plotTheme(){
  return {
    bg: cssVar("--plot-bg") || "#ffffff",
    text: cssVar("--plot-text") || "#222222",
    muted: cssVar("--plot-muted") || "#666666",
    axis: cssVar("--plot-axis") || "rgba(0,0,0,0.55)",
    grid: cssVar("--plot-grid") || "rgba(0,0,0,0.12)",
    node: cssVar("--plot-node") || "rgba(0,0,0,0.22)",
  };
}

function getDataIndex(iR, iV, ch, iT){
  const [R, V, C, T] = state.shape;
  return (((iR*V + iV)*C + ch)*T + iT);
}

function findCell(arr, x){
  // returns i such that arr[i] <= x <= arr[i+1], clamped to [0, n-2]
  let lo = 0, hi = arr.length - 1;
  if (x <= arr[0]) return 0;
  if (x >= arr[arr.length-1]) return arr.length - 2;
  while (hi - lo > 1){
    const mid = (lo + hi) >> 1;
    if (arr[mid] <= x) lo = mid; else hi = mid;
  }
  return lo;
}

function bilinearP12(reff, veff, ch){
  const rArr = state.reffArr;
  const vArr = state.veffArr;

  const xArr = state.logInterp ? rArr.map(Math.log) : rArr;
  const x0 = state.logInterp ? Math.log(reff) : reff;
  const y0 = veff;

  const i = findCell(xArr, x0);
  const j = findCell(vArr, y0);

  const x1 = xArr[i], x2 = xArr[i+1];
  const y1 = vArr[j], y2 = vArr[j+1];

  const tx = clamp((x0 - x1) / (x2 - x1 + 1e-30), 0, 1);
  const ty = clamp((y0 - y1) / (y2 - y1 + 1e-30), 0, 1);

  const T = state.thetaArr.length;
  const out = new Float32Array(T);

  for (let t=0; t<T; t++){
    const v00 = state.data[getDataIndex(i,   j,   ch, t)];
    const v10 = state.data[getDataIndex(i+1, j,   ch, t)];
    const v01 = state.data[getDataIndex(i,   j+1, ch, t)];
    const v11 = state.data[getDataIndex(i+1, j+1, ch, t)];

    const a = (1-tx)*v00 + tx*v10;
    const b = (1-tx)*v01 + tx*v11;
    out[t] = (1-ty)*a + ty*b;
  }
  return out;
}

function hansenDSD(reff, veff, n=400){
  // returns {r: Float32Array, y: Float32Array} with y normalised to max=1
  const k = 1.0/veff - 2.0;
  const theta = reff * veff;

  // choose a display range that captures broad tails reasonably
  const std = reff * Math.sqrt(veff);
  let rMax = reff + 10*std;
  rMax = Math.max(rMax, 4*reff);
  rMax = Math.min(rMax, 250); // safety cap for display

  const r = new Float32Array(n);
  const y = new Float32Array(n);
  const eps = 1e-6;

  // compute log pdf up to constant: (k-1) ln r - r/theta
  let maxLog = -1e30;
  for (let i=0;i<n;i++){
    const ri = (i/(n-1))*rMax;
    r[i] = ri;
    const rr = Math.max(ri, eps);
    const logv = (k-1)*Math.log(rr) - rr/theta;
    if (logv > maxLog) maxLog = logv;
    y[i] = logv;
  }
  // exponentiate and normalise max=1
  let maxY = 0;
  for (let i=0;i<n;i++){
    const val = Math.exp(y[i] - maxLog);
    y[i] = val;
    if (val > maxY) maxY = val;
  }
  if (maxY > 0){
    for (let i=0;i<n;i++) y[i] /= maxY;
  }
  return {r, y};
}

// -------------------- Drawing helpers (canvas) --------------------

function formatMagnitude(x){
  const ax = Math.abs(x);
  if (ax < 1e-10) return "0";
  if (ax > 0 && (ax < 0.01 || ax >= 1000)) return x.toExponential(1);
  if (ax < 0.1) return x.toFixed(3);
  if (ax < 1) return x.toFixed(2);
  if (ax < 10) return x.toFixed(1);
  return x.toFixed(0);
}

function niceTicks(min, max, count=5){
  if (!Number.isFinite(min) || !Number.isFinite(max) || min === max) return [min];
  const span = max - min;
  const rawStep = span / Math.max(1, count - 1);
  const pow10 = Math.pow(10, Math.floor(Math.log10(Math.abs(rawStep))));
  const err = rawStep / pow10;
  const step = (err >= 7.5 ? 10 : err >= 3.5 ? 5 : err >= 1.5 ? 2 : 1) * pow10;
  const start = Math.ceil(min / step) * step;
  const ticks = [];
  for (let v=start; v<=max + step*0.5; v+=step){
    if (v >= min - step*0.5) ticks.push(Number(v.toPrecision(12)));
  }
  return ticks;
}

function ticksWithZero(min, max, count=5){
  const ticks = niceTicks(min, max, count);
  if (min < 0 && max > 0 && !ticks.some((tick)=>Math.abs(tick) < 1e-10)){
    ticks.push(0);
    ticks.sort((a,b)=>a-b);
  }
  return ticks.map((tick)=>Math.abs(tick) < 1e-10 ? 0 : tick);
}

function drawXRegion(ctx, w, h, padding, x0, x1, xMin, xMax, color, label){
  const left = padding + (x0 - xMin) / (xMax - xMin + 1e-30) * (w - 2*padding);
  const right = padding + (x1 - xMin) / (xMax - xMin + 1e-30) * (w - 2*padding);
  const x = Math.max(padding, Math.min(left, right));
  const width = Math.min(w-padding, Math.max(left, right)) - x;
  if (width <= 0) return;

  ctx.save();
  ctx.fillStyle = color;
  ctx.fillRect(x, padding, width, h - 2*padding);
  ctx.fillStyle = plotTheme().muted;
  ctx.font = "11px system-ui, -apple-system, Segoe UI, Roboto";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(label, x + width/2, padding + 7);
  ctx.restore();
}

function drawAxes(ctx, w, h, padding, xLabel, yLabel, xTicks=[], yTicks=[], xToPx=null, yToPy=null){
  const theme = plotTheme();
  ctx.save();
  ctx.strokeStyle = theme.grid;
  ctx.fillStyle = theme.muted;
  ctx.lineWidth = 1;
  ctx.font = "11px system-ui, -apple-system, Segoe UI, Roboto";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  if (xToPx){
    for (const tick of xTicks){
      const px = xToPx(tick);
      ctx.beginPath();
      ctx.moveTo(px, padding);
      ctx.lineTo(px, h-padding);
      ctx.stroke();
      ctx.fillText(formatMagnitude(tick), px, h-padding+7);
    }
  }

  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  if (yToPy){
    for (const tick of yTicks){
      const py = yToPy(tick);
      ctx.beginPath();
      ctx.moveTo(padding, py);
      ctx.lineTo(w-padding, py);
      ctx.stroke();
      ctx.fillText(formatMagnitude(tick), padding-7, py);
    }
  }

  ctx.strokeStyle = theme.axis;
  ctx.fillStyle = theme.text;

  // axes
  ctx.beginPath();
  ctx.moveTo(padding, h-padding);
  ctx.lineTo(w-padding, h-padding);
  ctx.moveTo(padding, h-padding);
  ctx.lineTo(padding, padding);
  ctx.stroke();

  // labels
  ctx.font = "12px system-ui, -apple-system, Segoe UI, Roboto";
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(xLabel, w/2 - ctx.measureText(xLabel).width/2, h-6);

  ctx.save();
  ctx.translate(12, h/2);
  ctx.rotate(-Math.PI/2);
  ctx.fillText(yLabel, 0, 0);
  ctx.restore();

  ctx.restore();
}

function plotLine(ctx, w, h, padding, xArr, yArr, xMin, xMax, yMin, yMax, color, lw=2){
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lw;
  ctx.beginPath();
  for (let i=0;i<xArr.length;i++){
    const x = xArr[i], y = yArr[i];
    const px = padding + (x - xMin) / (xMax - xMin + 1e-30) * (w - 2*padding);
    const py = (h-padding) - (y - yMin) / (yMax - yMin + 1e-30) * (h - 2*padding);
    if (i===0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.restore();
}

function clearCanvas(ctx, w, h){
  ctx.clearRect(0,0,w,h);
  // fill background
  ctx.save();
  ctx.fillStyle = plotTheme().bg;
  ctx.fillRect(0,0,w,h);
  ctx.restore();
}

// -------------------- Selector panel --------------------

function selToPixel(reff, veff, w, h, pad){
  const rMin = state.reffArr[0], rMax = state.reffArr[state.reffArr.length-1];
  const vMin = state.veffArr[0], vMax = state.veffArr[state.veffArr.length-1];

  const x0 = state.logX ? Math.log(reff) : reff;
  const xMin = state.logX ? Math.log(rMin) : rMin;
  const xMax = state.logX ? Math.log(rMax) : rMax;

  const px = pad + (x0 - xMin) / (xMax - xMin) * (w - 2*pad);
  const py = (h-pad) - (veff - vMin) / (vMax - vMin) * (h - 2*pad);
  return {px, py};
}

function pixelToSel(px, py, w, h, pad){
  const rMin = state.reffArr[0], rMax = state.reffArr[state.reffArr.length-1];
  const vMin = state.veffArr[0], vMax = state.veffArr[state.veffArr.length-1];

  const xMin = state.logX ? Math.log(rMin) : rMin;
  const xMax = state.logX ? Math.log(rMax) : rMax;

  const x0 = xMin + (clamp(px, pad, w-pad) - pad) / (w - 2*pad) * (xMax - xMin);
  const reff = state.logX ? Math.exp(x0) : x0;

  const veff = vMin + ((h-pad) - clamp(py, pad, h-pad)) / (h - 2*pad) * (vMax - vMin);
  return {
    reff: clamp(reff, rMin, rMax),
    veff: clamp(veff, vMin, vMax),
  };
}

function drawSelector(){
  const canvas = document.getElementById("canvasSel");
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;
  const pad = 46;

  clearCanvas(ctx, w, h);

  const rMin = state.reffArr[0], rMax = state.reffArr[state.reffArr.length-1];
  const vMin = state.veffArr[0], vMax = state.veffArr[state.veffArr.length-1];
  const xTicks = state.logX
    ? niceTicks(Math.log(rMin), Math.log(rMax), 5).map(Math.exp)
    : niceTicks(rMin, rMax, 5);
  const yTicks = niceTicks(vMin, vMax, 5);
  drawAxes(
    ctx, w, h, pad,
    state.logX ? "log reff (µm)" : "reff (µm)",
    "veff",
    xTicks,
    yTicks,
    (x)=>selToPixel(x, vMin, w, h, pad).px,
    (y)=>selToPixel(rMin, y, w, h, pad).py
  );

  // draw grid of permissible nodes lightly
  ctx.save();
  ctx.fillStyle = plotTheme().node;
  const rArr = state.reffArr;
  const vArr = state.veffArr;
  for (let i=0;i<rArr.length;i++){
    for (let j=0;j<vArr.length;j++){
      const {px, py} = selToPixel(rArr[i], vArr[j], w, h, pad);
      ctx.beginPath();
      ctx.arc(px, py, 1.4, 0, 2*Math.PI);
      ctx.fill();
    }
  }
  ctx.restore();

  // draw pinned points
  if (state.multi && state.pinned.length){
    for (const p of state.pinned){
      const {px,py} = selToPixel(p.reff, p.veff, w, h, pad);
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = 0.65;
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, 2*Math.PI);
      ctx.fill();
      ctx.restore();
    }
  }

  // draw current point
  const {px, py} = selToPixel(state.reff, state.veff, w, h, pad);
  ctx.save();
  ctx.strokeStyle = "#ffffff";
  ctx.fillStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(px, py, 7, 0, 2*Math.PI);
  ctx.stroke();
  ctx.fillStyle = currentColor;
  ctx.beginPath();
  ctx.arc(px, py, 5, 0, 2*Math.PI);
  ctx.fill();
  ctx.restore();

  // status text
  ctx.save();
  ctx.fillStyle = plotTheme().text;
  ctx.font = "12px system-ui, -apple-system, Segoe UI, Roboto";
  const msg = `reff=${fmt(state.reff,4)} µm   veff=${fmt(state.veff,4)}`;
  ctx.fillText(msg, pad, pad-14);
  ctx.restore();
}

// -------------------- DSD plot --------------------

function drawDSD(){
  const canvas = document.getElementById("canvasDSD");
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;
  const pad = 46;
  const {r, y} = hansenDSD(state.reff, state.veff);
  let xMax = r[r.length-1];
  if (state.multi){
    for (const p of state.pinned){
      const dsd = hansenDSD(p.reff, p.veff);
      xMax = Math.max(xMax, dsd.r[dsd.r.length-1]);
    }
  }

  clearCanvas(ctx, w, h);
  drawAxes(
    ctx, w, h, pad,
    "r (µm)",
    "n(r) (norm)",
    niceTicks(0, xMax, 5),
    [0, 0.2, 0.4, 0.6, 0.8, 1.0],
    (x)=>pad + x / (xMax + 1e-30) * (w - 2*pad),
    (yy)=>(h-pad) - yy / 1.05 * (h - 2*pad)
  );

  // pinned first (lighter)
  if (state.multi){
    for (const p of state.pinned){
      const dsd = hansenDSD(p.reff, p.veff);
      plotLine(ctx, w, h, pad, dsd.r, dsd.y, 0, xMax, 0, 1.05, p.color, 1.5);
    }
  }

  plotLine(ctx, w, h, pad, r, y, 0, xMax, 0, 1.05, currentColor, 2.3);

  // legends (HTML)
  const legend = document.getElementById("legendDSD");
  legend.innerHTML = "";
  const items = [];
  if (state.multi && state.pinned.length){
    for (const p of state.pinned){
      items.push({label:`reff=${fmt(p.reff,2)} µm, veff=${fmt(p.veff,2)}`, color:p.color});
    }
  }
  if (items.length){
    items.push({label:`current reff=${fmt(state.reff,2)} µm, veff=${fmt(state.veff,2)}`, color:currentColor});
  }
  if (items.length){
    for (const it of items){
      const div = document.createElement("div");
      div.className = "item";
      const sw = document.createElement("span");
      sw.className = "swatch";
      sw.style.background = it.color;
      const sp = document.createElement("span");
      sp.textContent = it.label;
      div.appendChild(sw); div.appendChild(sp);
      legend.appendChild(div);
    }
  }
}

// -------------------- P12 plot --------------------

function drawP12(){
  const canvas = document.getElementById("canvasP12");
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;
  const pad = 46;

  const theta = state.thetaArr;
  const xMin = theta[0], xMax = theta[theta.length-1];

  // compute y-range
  let yMin = 1e30, yMax = -1e30;
  const series = [];
  if (state.multi && state.pinned.length){
    for (const p of state.pinned){
      const y = bilinearP12(p.reff, p.veff, state.channel);
      series.push({y, color:p.color, label:`reff=${fmt(p.reff,2)} µm, veff=${fmt(p.veff,2)}`});
      for (let i=0;i<y.length;i++){ yMin = Math.min(yMin, y[i]); yMax = Math.max(yMax, y[i]); }
    }
  }
  const yCur = bilinearP12(state.reff, state.veff, state.channel);
  series.push({y:yCur, color:currentColor, label:`current reff=${fmt(state.reff,2)} µm, veff=${fmt(state.veff,2)}`});
  for (let i=0;i<yCur.length;i++){ yMin = Math.min(yMin, yCur[i]); yMax = Math.max(yMax, yCur[i]); }

  // pad y-range a bit
  const padY = 0.06*(yMax - yMin + 1e-9);
  yMin -= padY; yMax += padY;
  if (Math.abs(yMin) < 1e-10) yMin = 0;
  if (Math.abs(yMax) < 1e-10) yMax = 0;
  clearCanvas(ctx, w, h);
  drawXRegion(ctx, w, h, pad, 135, 165, xMin, xMax, "rgba(38, 152, 186, 0.10)", "cloudbow");
  drawXRegion(ctx, w, h, pad, 170, 180, xMin, xMax, "rgba(255, 122, 69, 0.10)", "glory");
  drawAxes(
    ctx, w, h, pad,
    "θ (deg)",
    "P12",
    niceTicks(xMin, xMax, 5),
    ticksWithZero(yMin, yMax, 5),
    (x)=>pad + (x - xMin) / (xMax - xMin + 1e-30) * (w - 2*pad),
    (y)=>(h-pad) - (y - yMin) / (yMax - yMin + 1e-30) * (h - 2*pad)
  );
  if (yMin < 0 && yMax > 0){
    const y0 = (h-pad) - (0 - yMin) / (yMax - yMin + 1e-30) * (h - 2*pad);
    ctx.save();
    ctx.strokeStyle = plotTheme().axis;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(pad, y0);
    ctx.lineTo(w-pad, y0);
    ctx.stroke();
    ctx.restore();
  }

  // plot
  for (const s of series){
    plotLine(ctx, w, h, pad, theta, s.y, xMin, xMax, yMin, yMax, s.color, s.color===currentColor?2.3:1.5);
  }

  // legends (HTML)
  const legend = document.getElementById("legendP12");
  legend.innerHTML = "";
  if (state.multi && state.pinned.length){
    for (const p of state.pinned){
      const div = document.createElement("div");
      div.className = "item";
      const sw = document.createElement("span");
      sw.className = "swatch";
      sw.style.background = p.color;
      const sp = document.createElement("span");
      sp.textContent = `reff=${fmt(p.reff,2)} µm, veff=${fmt(p.veff,2)}`;
      div.appendChild(sw); div.appendChild(sp);
      legend.appendChild(div);
    }
    // current
    const div = document.createElement("div");
    div.className = "item";
    const sw = document.createElement("span");
    sw.className = "swatch";
    sw.style.background = currentColor;
    const sp = document.createElement("span");
    sp.textContent = `current reff=${fmt(state.reff,2)} µm, veff=${fmt(state.veff,2)}`;
    div.appendChild(sw); div.appendChild(sp);
    legend.appendChild(div);
  }

  // update interp chip
  document.getElementById("chipInterp").textContent = `interp: ${state.logInterp ? "log(reff)" : "linear reff"}`;
}

// -------------------- DSD bubble preview --------------------

function pseudoRandom(i){
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function sampleRadiusFromDSD(dsd, q){
  let total = 0;
  for (let i=1;i<dsd.r.length;i++){
    total += 0.5 * (dsd.y[i-1] + dsd.y[i]) * (dsd.r[i] - dsd.r[i-1]);
  }
  if (total <= 0) return dsd.r[Math.floor(dsd.r.length / 2)];

  const target = q * total;
  let accum = 0;
  for (let i=1;i<dsd.r.length;i++){
    const area = 0.5 * (dsd.y[i-1] + dsd.y[i]) * (dsd.r[i] - dsd.r[i-1]);
    if (accum + area >= target){
      const t = (target - accum) / (area + 1e-30);
      return dsd.r[i-1] + clamp(t, 0, 1) * (dsd.r[i] - dsd.r[i-1]);
    }
    accum += area;
  }
  return dsd.r[dsd.r.length - 1];
}

function currentBubbleSignature(){
  if (!state.loaded || !state.reffArr || !state.veffArr) return "unloaded";
  return [
    state.multi ? "multi" : "single",
    state.name,
    state.reff.toFixed(3),
    state.veff.toFixed(4),
    document.getElementById("canvasBubbles")?.width || 0,
    document.getElementById("canvasBubbles")?.height || 0,
  ].join("|");
}

function bubbleScaleBounds(){
  if (!state.reffArr || !state.veffArr) return {minR: 1, maxR: 40};
  const minReff = state.reffArr[0];
  const maxReff = state.reffArr[state.reffArr.length - 1];
  const maxVeff = state.veffArr[state.veffArr.length - 1];
  const maxStd = maxReff * Math.sqrt(maxVeff);
  return {
    minR: Math.max(1e-6, minReff * 0.18),
    maxR: Math.max(minReff, maxReff + 4 * maxStd),
  };
}

function radiusToBubblePx(radius, w, h){
  const {minR, maxR} = bubbleScaleBounds();
  const minBubble = Math.max(1.8, Math.min(w, h) * 0.010);
  const maxBubble = Math.max(8, Math.min(w, h) * 0.078);
  const t = clamp((radius - minR) / (maxR - minR + 1e-30), 0, 1);
  return minBubble + Math.sqrt(t) * (maxBubble - minBubble);
}

function rebuildBubbleParticles(w, h){
  const dsd = hansenDSD(state.reff, state.veff, 500);
  const droplets = 88;
  const marginTop = 42;
  bubbleParticles = [];

  for (let i=0;i<droplets;i++){
    const q = (i + 0.5) / droplets;
    const radius = sampleRadiusFromDSD(dsd, q);
    const bubbleR = radiusToBubblePx(radius, w, h);
    bubbleParticles.push({
      q,
      radius,
      baseR: bubbleR,
      r: bubbleR,
      x: clamp(24 + pseudoRandom(i) * (w - 48), bubbleR + 16, w - bubbleR - 16),
      y: clamp(marginTop + pseudoRandom(i + 1000) * (h - marginTop - 18), bubbleR + marginTop, h - bubbleR - 16),
      vx: (pseudoRandom(i + 2000) - 0.5) * 0.4,
      vy: (pseudoRandom(i + 3000) - 0.5) * 0.4,
      phase: pseudoRandom(i + 4000) * Math.PI * 2,
      alpha: 0.22 + 0.30 * pseudoRandom(i + 5000),
    });
  }
}

function stepBubbleParticles(dt, tSec, w, h){
  const marginTop = 42;
  const damping = Math.pow(0.16, dt);
  const repulsion = 54;
  const spring = 1.35;

  for (let i=0;i<bubbleParticles.length;i++){
    const p = bubbleParticles[i];
    const pulse = 1 + 0.12 * Math.sin(tSec * (0.68 + 0.5 * pseudoRandom(i + 6000)) + p.phase);
    p.r += (p.baseR * pulse - p.r) * Math.min(1, dt * 4.5);
    p.vx += Math.sin(tSec * (0.22 + pseudoRandom(i + 7000) * 0.22) + p.phase) * dt * 1.4;
    p.vy += Math.cos(tSec * (0.20 + pseudoRandom(i + 8000) * 0.22) + p.phase * 0.7) * dt * 1.2;
  }

  for (let i=0;i<bubbleParticles.length;i++){
    const a = bubbleParticles[i];
    for (let j=i+1;j<bubbleParticles.length;j++){
      const b = bubbleParticles[j];
      let dx = b.x - a.x;
      let dy = b.y - a.y;
      let dist = Math.hypot(dx, dy);
      const minDist = a.r + b.r + 2.0;
      if (dist < 1e-6){
        const ang = pseudoRandom(i * 101 + j) * Math.PI * 2;
        dx = Math.cos(ang);
        dy = Math.sin(ang);
        dist = 1;
      }
      if (dist < minDist){
        const nx = dx / dist;
        const ny = dy / dist;
        const overlap = minDist - dist;
        const force = overlap * repulsion * dt;
        a.vx -= nx * force;
        a.vy -= ny * force;
        b.vx += nx * force;
        b.vy += ny * force;

        const correction = overlap * 0.18;
        a.x -= nx * correction;
        a.y -= ny * correction;
        b.x += nx * correction;
        b.y += ny * correction;
      }
    }
  }

  for (let i=0;i<bubbleParticles.length;i++){
    const p = bubbleParticles[i];
    const targetX = 24 + pseudoRandom(i) * (w - 48);
    const targetY = marginTop + pseudoRandom(i + 1000) * (h - marginTop - 18);
    p.vx += (targetX - p.x) * spring * dt;
    p.vy += (targetY - p.y) * spring * dt;
    p.vx *= damping;
    p.vy *= damping;
    p.x += p.vx * dt;
    p.y += p.vy * dt;

    const left = 16 + p.r;
    const right = w - 16 - p.r;
    const top = marginTop + p.r;
    const bottom = h - 16 - p.r;
    if (p.x < left){ p.x = left; p.vx = Math.abs(p.vx) * 0.35; }
    if (p.x > right){ p.x = right; p.vx = -Math.abs(p.vx) * 0.35; }
    if (p.y < top){ p.y = top; p.vy = Math.abs(p.vy) * 0.35; }
    if (p.y > bottom){ p.y = bottom; p.vy = -Math.abs(p.vy) * 0.35; }
  }
}

function drawBubbleDSD(timeMs=0){
  const canvas = document.getElementById("canvasBubbles");
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;
  const theme = plotTheme();
  const tSec = timeMs / 1000;
  clearCanvas(ctx, w, h);

  const chip = document.getElementById("chipBubbleMode");
  chip.textContent = state.multi ? "multi disabled" : "single DSD";

  if (state.multi){
    ctx.save();
    ctx.fillStyle = theme.muted;
    ctx.font = "14px system-ui, -apple-system, Segoe UI, Roboto";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Bubble preview is available in single-DSD mode.", w/2, h/2 - 10);
    ctx.fillText("Turn off multi DSD to inspect the selected distribution.", w/2, h/2 + 14);
    ctx.restore();
    return;
  }

  const signature = currentBubbleSignature();
  if (signature !== bubbleSignature){
    bubbleSignature = signature;
    bubbleLastTime = timeMs;
    rebuildBubbleParticles(w, h);
  }
  const dt = clamp((timeMs - bubbleLastTime) / 1000, 0.016, 0.08);
  bubbleLastTime = timeMs;
  stepBubbleParticles(dt, tSec, w, h);

  ctx.save();
  ctx.fillStyle = theme.muted;
  ctx.font = "12px system-ui, -apple-system, Segoe UI, Roboto";
  ctx.fillText(`single DSD: r_eff=${fmt(state.reff,2)} µm, v_eff=${fmt(state.veff,2)}`, 18, 24);
  ctx.fillText("fixed LUT radius scale", 18, 39);

  for (const p of bubbleParticles){
    const bubbleR = p.r;
    const x = p.x;
    const y = p.y;
    const alpha = p.alpha;
    const glow = ctx.createRadialGradient(x - bubbleR*0.35, y - bubbleR*0.35, bubbleR*0.15, x, y, bubbleR);
    glow.addColorStop(0, `rgba(255, 255, 255, ${0.24 + alpha * 0.3})`);
    glow.addColorStop(0.42, `rgba(38, 152, 186, ${alpha})`);
    glow.addColorStop(1, "rgba(38, 152, 186, 0.05)");

    ctx.beginPath();
    ctx.fillStyle = glow;
    ctx.strokeStyle = `rgba(38, 152, 186, ${0.45 + alpha * 0.6})`;
    ctx.lineWidth = 1;
    ctx.arc(x, y, bubbleR, 0, 2*Math.PI);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function animateBubbleDSD(){
  if (state.loaded){
    drawBubbleDSD(performance.now());
  }
}

// -------------------- Responsive panel sizing --------------------

function canvasIds(){
  return ["canvasSel", "canvasDSD", "canvasP12", "canvasBubbles"];
}

function panelChromeHeight(panel, canvas){
  let used = 22;
  for (const child of panel.children){
    if (child === canvas) continue;
    used += child.getBoundingClientRect().height;
  }
  return used;
}

function autoCanvasHeights(){
  const grid = document.getElementById("panelGrid");
  if (!grid) return [260, 260];
  const gridTop = grid.getBoundingClientRect().top;
  const footer = document.querySelector(".footer");
  const footerH = footer ? footer.getBoundingClientRect().height : 0;
  const available = Math.max(360, window.innerHeight - gridTop - footerH - 36);
  const topShare = layoutState.userRowRatio ?? layoutState.rowRatio;
  const rowGap = 24;
  return [
    clamp((available - rowGap) * topShare, 190, 360),
    clamp((available - rowGap) * (1 - topShare), 190, 360),
  ];
}

function resizeCanvasBackings(){
  const rowHeights = autoCanvasHeights();
  let changed = false;

  for (const id of canvasIds()){
    const canvas = document.getElementById(id);
    if (!canvas) continue;
    const panel = canvas.closest(".panel");
    const row = canvas.closest(".panel-row");
    const rowIndex = row ? Number(row.dataset.row || 0) : 0;
    const rect = canvas.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    const cssW = clamp(Math.round(rect.width || panelRect.width - 22), 280, 920);
    const autoH = Math.round(rowHeights[rowIndex] - panelChromeHeight(panel, canvas));
    const aspectH = Math.round(cssW * 0.50);
    const cssH = clamp(Math.min(aspectH, autoH), 180, 340);
    const nextW = cssW;
    const nextH = cssH;

    canvas.style.height = `${cssH}px`;
    if (canvas.width !== nextW || canvas.height !== nextH){
      canvas.width = nextW;
      canvas.height = nextH;
      changed = true;
    }
  }

  if (changed){
    bubbleSignature = "";
  }
  return changed;
}

function scheduleResizeRedraw(){
  resizeCanvasBackings();
  redrawAll();
}

function applyColumnRatios(){
  document.querySelectorAll(".panel-row").forEach((row)=>{
    const index = Number(row.dataset.row || 0);
    row.style.setProperty("--left", `${layoutState.colRatios[index] * 100}%`);
  });
}

function setupPanelResize(){
  applyColumnRatios();
  const observer = new ResizeObserver(()=>scheduleResizeRedraw());
  const grid = document.getElementById("panelGrid");
  if (grid) observer.observe(grid);

  function setColumnFromClientX(row, rowIndex, clientX){
    const rowRect = row.getBoundingClientRect();
    const ratio = clamp((clientX - rowRect.left) / rowRect.width, 0.32, 0.68);
    layoutState.colRatios[rowIndex] = ratio;
    applyColumnRatios();
    scheduleResizeRedraw();
  }

  function setRowsFromClientY(clientY){
    const gridRect = document.getElementById("panelGrid").getBoundingClientRect();
    layoutState.userRowRatio = clamp((clientY - gridRect.top) / gridRect.height, 0.38, 0.62);
    scheduleResizeRedraw();
  }

  document.querySelectorAll(".col-resizer").forEach((handle)=>{
    handle.addEventListener("pointerdown", (event)=>{
      const row = handle.closest(".panel-row");
      const rowIndex = Number(handle.dataset.row || 0);
      document.body.classList.add("resizing");
      handle.setPointerCapture(event.pointerId);

      function move(moveEvent){
        setColumnFromClientX(row, rowIndex, moveEvent.clientX);
      }

      function end(){
        document.body.classList.remove("resizing");
        handle.removeEventListener("pointermove", move);
        handle.removeEventListener("pointerup", end);
        handle.removeEventListener("pointercancel", end);
      }

      handle.addEventListener("pointermove", move);
      handle.addEventListener("pointerup", end);
      handle.addEventListener("pointercancel", end);
      event.preventDefault();
    });

    handle.addEventListener("mousedown", (event)=>{
      const row = handle.closest(".panel-row");
      const rowIndex = Number(handle.dataset.row || 0);
      document.body.classList.add("resizing");

      function move(moveEvent){
        setColumnFromClientX(row, rowIndex, moveEvent.clientX);
      }

      function end(){
        document.body.classList.remove("resizing");
        window.removeEventListener("mousemove", move);
        window.removeEventListener("mouseup", end);
      }

      window.addEventListener("mousemove", move);
      window.addEventListener("mouseup", end);
      event.preventDefault();
    });
  });

  const rowHandle = document.querySelector(".row-resizer");
  if (rowHandle){
    rowHandle.addEventListener("pointerdown", (event)=>{
      document.body.classList.add("resizing");
      rowHandle.setPointerCapture(event.pointerId);

      function move(moveEvent){
        setRowsFromClientY(moveEvent.clientY);
      }

      function end(){
        document.body.classList.remove("resizing");
        rowHandle.removeEventListener("pointermove", move);
        rowHandle.removeEventListener("pointerup", end);
        rowHandle.removeEventListener("pointercancel", end);
      }

      rowHandle.addEventListener("pointermove", move);
      rowHandle.addEventListener("pointerup", end);
      rowHandle.addEventListener("pointercancel", end);
      event.preventDefault();
    });

    rowHandle.addEventListener("mousedown", (event)=>{
      document.body.classList.add("resizing");

      function move(moveEvent){
        setRowsFromClientY(moveEvent.clientY);
      }

      function end(){
        document.body.classList.remove("resizing");
        window.removeEventListener("mousemove", move);
        window.removeEventListener("mouseup", end);
      }

      window.addEventListener("mousemove", move);
      window.addEventListener("mouseup", end);
      event.preventDefault();
    });
  }

  window.addEventListener("resize", scheduleResizeRedraw);
}

// -------------------- UI / Interaction --------------------

function updateInputs(){
  document.getElementById("inputReff").value = fmt(state.reff, 4);
  document.getElementById("inputVeff").value = fmt(state.veff, 4);
  document.getElementById("toggleLogX").checked = state.logX;
  document.getElementById("toggleLogInterp").checked = state.logInterp;
  document.getElementById("toggleMulti").checked = state.multi;
}

function redrawAll(){
  if (!state.loaded) return;
  drawSelector();
  drawDSD();
  drawP12();
  drawBubbleDSD(performance.now());
}

function pinCurrentSelection(){
  if (!state.multi) return;
  // assign next colour
  const color = palette[state.pinned.length % palette.length];
  state.pinned.push({reff: state.reff, veff: state.veff, color});
}

function clearAll(){
  state.pinned = [];
  // clear canvases to blank background while keeping selector dot
  redrawAll();
  // additionally clear legends
  document.getElementById("legendDSD").innerHTML = "";
  document.getElementById("legendP12").innerHTML = "";
}

function setChannel(ch){
  state.channel = ch;
  document.querySelectorAll(".btn.channel").forEach(b=>b.classList.remove("active"));
  if (ch===1) document.getElementById("btnG").classList.add("active");
  if (ch===0) document.getElementById("btnR").classList.add("active");
  if (ch===2) document.getElementById("btnB").classList.add("active");
  redrawAll();
}

function setupSelectorEvents(){
  const canvas = document.getElementById("canvasSel");
  const pad = 46;
  let dragging = false;
  let dragPinnedIndex = -1;
  let dragCurrent = false;
  let dragMoved = false;
  let dragStart = null;

  function eventPosition(evt){
    const rect = canvas.getBoundingClientRect();
    return {
      x: (evt.clientX - rect.left) * (canvas.width / rect.width),
      y: (evt.clientY - rect.top) * (canvas.height / rect.height),
    };
  }

  function nearestPinnedIndex(x, y){
    if (!state.multi) return -1;
    let best = -1;
    let bestDist = 12 * 12;
    for (let i=0;i<state.pinned.length;i++){
      const p = state.pinned[i];
      const {px, py} = selToPixel(p.reff, p.veff, canvas.width, canvas.height, pad);
      const d2 = (px-x)*(px-x) + (py-y)*(py-y);
      if (d2 < bestDist){
        best = i;
        bestDist = d2;
      }
    }
    return best;
  }

  function isCurrentPoint(x, y){
    const {px, py} = selToPixel(state.reff, state.veff, canvas.width, canvas.height, pad);
    const d2 = (px-x)*(px-x) + (py-y)*(py-y);
    return d2 <= 12 * 12;
  }

  function setFromPosition(x, y){
    const sel = pixelToSel(x, y, canvas.width, canvas.height, pad);

    if (dragPinnedIndex >= 0){
      state.pinned[dragPinnedIndex].reff = sel.reff;
      state.pinned[dragPinnedIndex].veff = sel.veff;
    } else {
      state.reff = sel.reff;
      state.veff = sel.veff;
    }

    updateInputs();
    redrawAll();
  }

  canvas.addEventListener("mousedown", (e)=>{
    const {x, y} = eventPosition(e);
    dragPinnedIndex = nearestPinnedIndex(x, y);
    dragCurrent = dragPinnedIndex < 0 && isCurrentPoint(x, y);
    dragMoved = false;
    dragStart = {x, y, reff: state.reff, veff: state.veff};
    dragging = true;
    if (dragPinnedIndex >= 0 || dragCurrent || !state.multi){
      setFromPosition(x, y);
    }
  });
  window.addEventListener("mousemove", (e)=>{
    if (!dragging) return;
    const {x, y} = eventPosition(e);
    if (dragStart && ((x-dragStart.x)*(x-dragStart.x) + (y-dragStart.y)*(y-dragStart.y)) > 16){
      dragMoved = true;
    }
    if (dragPinnedIndex >= 0 || dragCurrent || !state.multi){
      setFromPosition(x, y);
    }
  });
  window.addEventListener("mouseup", (e)=>{
    if (dragging && state.multi && dragPinnedIndex < 0 && !dragCurrent && !dragMoved){
      const {x, y} = eventPosition(e);
      pinCurrentSelection();
      setFromPosition(x, y);
    }
    dragging = false;
    dragPinnedIndex = -1;
    dragCurrent = false;
    dragMoved = false;
    dragStart = null;
  });
}

function setupControls(){
  document.getElementById("toggleLogX").addEventListener("change", (e)=>{
    state.logX = e.target.checked;
    redrawAll();
  });
  document.getElementById("toggleLogInterp").addEventListener("change", (e)=>{
    state.logInterp = e.target.checked;
    redrawAll();
  });
  document.getElementById("toggleMulti").addEventListener("change", (e)=>{
    state.multi = e.target.checked;
    if (!state.multi){
      state.pinned = [];
      document.getElementById("legendDSD").innerHTML = "";
      document.getElementById("legendP12").innerHTML = "";
    }
    redrawAll();
  });

  document.getElementById("btnClear").addEventListener("click", ()=>{
    clearAll();
  });

  // textboxes: treat "enter" as new selection (pins when multi)
  document.getElementById("inputReff").addEventListener("change", (e)=>{
    const val = parseFloat(e.target.value);
    if (!Number.isFinite(val)) return;
    if (state.multi) pinCurrentSelection();
    state.reff = clamp(val, state.reffArr[0], state.reffArr[state.reffArr.length-1]);
    updateInputs(); redrawAll();
  });
  document.getElementById("inputVeff").addEventListener("change", (e)=>{
    const val = parseFloat(e.target.value);
    if (!Number.isFinite(val)) return;
    if (state.multi) pinCurrentSelection();
    state.veff = clamp(val, state.veffArr[0], state.veffArr[state.veffArr.length-1]);
    updateInputs(); redrawAll();
  });

  document.getElementById("btnR").addEventListener("click", ()=>setChannel(0));
  document.getElementById("btnG").addEventListener("click", ()=>setChannel(1));
  document.getElementById("btnB").addEventListener("click", ()=>setChannel(2));

  document.getElementById("btnLoadSmall").addEventListener("click", ()=>loadLUT("small"));
  document.getElementById("btnLoadFull").addEventListener("click", ()=>loadLUT("full"));
}

async function fetchJSON(url){
  const res = await fetch(url, {cache:"no-store"});
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return await res.json();
}

async function fetchBinFloat32(url){
  const res = await fetch(url, {cache:"no-store"});
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const buf = await res.arrayBuffer();
  return new Float32Array(buf);
}

async function loadLUT(kind="small"){
  try{
    setStatus(`Loading ${kind} LUT…`);
    const gridUrl = kind==="full" ? "data/grid.json" : "data/grid_small.json";
    const binUrl  = kind==="full" ? "data/lut_p12_rgb_f32.bin" : "data/lut_p12_rgb_small_f32.bin";

    const grid = await fetchJSON(gridUrl);
    const arr = await fetchBinFloat32(binUrl);

    state.reffArr = Float32Array.from(grid.reff_um);
    state.veffArr = Float32Array.from(grid.veff);
    state.thetaArr = Float32Array.from(grid.theta_deg);
    state.shape = grid.shape;
    state.data = arr;
    state.loaded = true;
    state.name = kind;

    // clamp selection into grid range
    state.reff = clamp(state.reff, state.reffArr[0], state.reffArr[state.reffArr.length-1]);
    state.veff = clamp(state.veff, state.veffArr[0], state.veffArr[state.veffArr.length-1]);

    // reset pinned if switching datasets
    state.pinned = [];
    updateInputs();
    resizeCanvasBackings();
    redrawAll();

    const sizeMB = (arr.byteLength / (1024*1024)).toFixed(2);
    setStatus(`Loaded ${kind} LUT (${state.shape.join("×")}, ${sizeMB} MB).`);
  }catch(err){
    console.error(err);
    setStatus(`Error: ${err.message}`);
  }
}

function init(){
  applyTheme();
  setupControls();
  setupSelectorEvents();
  setupPanelResize();
  loadLUT("small");
  if (bubbleAnimationTimer === null){
    bubbleAnimationTimer = window.setInterval(animateBubbleDSD, 90);
  }
}

window.addEventListener("DOMContentLoaded", init);
window.addEventListener("storage", (event)=>{
  if (event.key === "theme"){
    applyTheme();
    redrawAll();
  }
});
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", ()=>{
  applyTheme();
  redrawAll();
});
