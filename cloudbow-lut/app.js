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
  if (ax > 0 && (ax < 0.01 || ax >= 1000)) return x.toExponential(1);
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
  ctx.fillStyle = "#8ab4ff";
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
    niceTicks(0, 1.05, 5),
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

  plotLine(ctx, w, h, pad, r, y, 0, xMax, 0, 1.05, "#8ab4ff", 2.3);

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
    items.push({label:`current reff=${fmt(state.reff,2)} µm, veff=${fmt(state.veff,2)}`, color:"#8ab4ff"});
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
  series.push({y:yCur, color:"#8ab4ff", label:`current reff=${fmt(state.reff,2)} µm, veff=${fmt(state.veff,2)}`});
  for (let i=0;i<yCur.length;i++){ yMin = Math.min(yMin, yCur[i]); yMax = Math.max(yMax, yCur[i]); }

  // pad y-range a bit
  const padY = 0.06*(yMax - yMin + 1e-9);
  yMin -= padY; yMax += padY;
  clearCanvas(ctx, w, h);
  drawAxes(
    ctx, w, h, pad,
    "θ (deg)",
    "P12",
    niceTicks(xMin, xMax, 5),
    niceTicks(yMin, yMax, 5),
    (x)=>pad + (x - xMin) / (xMax - xMin + 1e-30) * (w - 2*pad),
    (y)=>(h-pad) - (y - yMin) / (yMax - yMin + 1e-30) * (h - 2*pad)
  );

  // plot
  for (const s of series){
    plotLine(ctx, w, h, pad, theta, s.y, xMin, xMax, yMin, yMax, s.color, s.color==="#8ab4ff"?2.3:1.5);
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
    sw.style.background = "#8ab4ff";
    const sp = document.createElement("span");
    sp.textContent = `current reff=${fmt(state.reff,2)} µm, veff=${fmt(state.veff,2)}`;
    div.appendChild(sw); div.appendChild(sp);
    legend.appendChild(div);
  }

  // update interp chip
  document.getElementById("chipInterp").textContent = `interp: ${state.logInterp ? "log(reff)" : "linear reff"}`;
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

  function setFromPosition(x, y, pinOnClick=false){
    const sel = pixelToSel(x, y, canvas.width, canvas.height, pad);

    if (dragPinnedIndex >= 0){
      state.pinned[dragPinnedIndex].reff = sel.reff;
      state.pinned[dragPinnedIndex].veff = sel.veff;
    } else {
      if (pinOnClick && state.multi){
        pinCurrentSelection();
      }
      state.reff = sel.reff;
      state.veff = sel.veff;
    }

    updateInputs();
    redrawAll();
  }

  canvas.addEventListener("mousedown", (e)=>{
    const {x, y} = eventPosition(e);
    dragPinnedIndex = nearestPinnedIndex(x, y);
    dragging = true;
    setFromPosition(x, y, dragPinnedIndex < 0);
  });
  window.addEventListener("mousemove", (e)=>{
    if (!dragging) return;
    const {x, y} = eventPosition(e);
    setFromPosition(x, y, false);
  });
  window.addEventListener("mouseup", ()=>{
    dragging = false;
    dragPinnedIndex = -1;
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
  loadLUT("small");
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
