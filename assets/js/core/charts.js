/* ============================================================
   Hand-rolled inline-SVG chart primitives.

   No chart library — small, reusable builders that follow the
   house rules: one axis, fixed categorical colour order, 2px
   surface gaps between marks, rounded bar ends, a legend whenever
   there is more than one series, and a hover layer (crosshair +
   tooltip on line charts, per-mark tooltip on bars/dots). Text
   always uses the ink tokens, never a series colour.
   ============================================================ */

import { esc } from './util.js';

const NS = 'http://www.w3.org/2000/svg';

function svg(tag, attrs = {}) {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
}

function niceMax(rawMax) {
  if (rawMax <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(rawMax));
  const steps = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];
  for (const s of steps) if (rawMax <= s * magnitude) return s * magnitude;
  return 10 * magnitude;
}

/* -------------------------------------------------------------
   Shared hover tooltip — one floating element reused by every
   chart on the page so we don't spawn dozens of positioned divs.
------------------------------------------------------------- */

let tipEl = null;
function tip() {
  if (!tipEl) {
    tipEl = document.createElement('div');
    tipEl.className = 'viz-tip';
    tipEl.setAttribute('role', 'status');
    document.body.append(tipEl);
  }
  return tipEl;
}

function showTip(x, y, html) {
  const node = tip();
  node.innerHTML = html;
  node.style.left = `${x}px`;
  node.style.top = `${y}px`;
  node.classList.add('on');
}
function hideTip() { if (tipEl) tipEl.classList.remove('on'); }

/* =============================================================
   Sparkline — stat-tile companion. Not a full chart: no axes,
   no legend, no tooltip. Used only alongside a headline number.
============================================================= */

export function sparkline(container, values, opts = {}) {
  container.innerHTML = '';
  if (!values || values.length < 2) return;
  const w = opts.width || 220;
  const h = opts.height || 34;
  const pad = 3;
  const color = opts.color || 'var(--bronze)';

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const step = (w - pad * 2) / (values.length - 1);
  const y = (v) => h - pad - ((v - min) / span) * (h - pad * 2);

  const points = values.map((v, i) => [pad + i * step, y(v)]);
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');

  const root = svg('svg', { viewBox: `0 0 ${w} ${h}`, class: 'spark', preserveAspectRatio: 'none' });
  root.append(svg('path', { d, fill: 'none', stroke: color, 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
  const last = points[points.length - 1];
  root.append(svg('circle', { cx: last[0], cy: last[1], r: 3, fill: color }));
  container.append(root);
}

/* =============================================================
   Line chart — one or more time series on a shared y-axis.
   opts: { series:[{id,label,color,values}], xLabels:[...],
           height, formatY, formatX, unit }
============================================================= */

export function lineChart(container, opts) {
  const { series, xLabels } = opts;
  const width = opts.width || container.clientWidth || 640;
  const height = opts.height || 260;
  const formatY = opts.formatY || ((v) => String(v));
  const formatX = opts.formatX || ((v) => String(v));

  const margin = { top: 16, right: 16, bottom: 30, left: 52 };
  const iw = width - margin.left - margin.right;
  const ih = height - margin.top - margin.bottom;

  const allVals = series.flatMap((s) => s.values);
  const rawMax = Math.max(...allVals, 0);
  const yMax = niceMax(rawMax * 1.08 || 1);
  const yMin = 0;
  const n = xLabels.length;
  const stepX = n > 1 ? iw / (n - 1) : iw;

  const xAt = (i) => margin.left + i * stepX;
  const yAt = (v) => margin.top + ih - ((v - yMin) / (yMax - yMin || 1)) * ih;

  const root = svg('svg', { viewBox: `0 0 ${width} ${height}`, class: 'chart', role: 'img' });
  const gridCount = 4;
  for (let g = 0; g <= gridCount; g += 1) {
    const val = (yMax / gridCount) * g;
    const y = yAt(val);
    root.append(svg('line', { x1: margin.left, x2: width - margin.right, y1: y, y2: y, class: 'grid-line' }));
    const label = svg('text', { x: margin.left - 10, y: y + 3, 'text-anchor': 'end', class: 'axis-label' });
    label.textContent = formatY(val);
    root.append(label);
  }
  root.append(svg('line', { x1: margin.left, x2: margin.left, y1: margin.top, y2: margin.top + ih, class: 'axis-line' }));
  root.append(svg('line', { x1: margin.left, x2: width - margin.right, y1: margin.top + ih, y2: margin.top + ih, class: 'axis-line' }));

  const xTickEvery = Math.max(1, Math.ceil(n / (width < 480 ? 4 : 8)));
  xLabels.forEach((lbl, i) => {
    if (i % xTickEvery !== 0 && i !== n - 1) return;
    const t = svg('text', { x: xAt(i), y: height - margin.bottom + 18, 'text-anchor': 'middle', class: 'axis-label' });
    t.textContent = formatX(lbl);
    root.append(t);
  });

  const visible = new Set(series.map((s) => s.id));

  const seriesGroup = svg('g');
  root.append(seriesGroup);

  function draw() {
    seriesGroup.innerHTML = '';
    series.forEach((s) => {
      if (!visible.has(s.id)) return;
      const pts = s.values.map((v, i) => [xAt(i), yAt(v)]);
      const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
      seriesGroup.append(svg('path', { d, class: 'series-line', stroke: s.color }));
      // sparse markers: first, last, and max — never one per point
      const maxIdx = s.values.indexOf(Math.max(...s.values));
      new Set([0, s.values.length - 1, maxIdx]).forEach((i) => {
        const [x, y] = pts[i];
        seriesGroup.append(svg('circle', { cx: x, cy: y, r: 4, fill: s.color, class: 'marker' }));
      });
    });
  }
  draw();

  // hover: crosshair + a tooltip row per visible series
  const hitW = stepX || iw;
  for (let i = 0; i < n; i += 1) {
    const hit = svg('rect', {
      x: xAt(i) - hitW / 2, y: margin.top, width: hitW, height: ih, class: 'hit',
    });
    hit.addEventListener('pointerenter', () => onHover(i));
    hit.addEventListener('pointermove', () => onHover(i));
    root.append(hit);
  }
  const crosshair = svg('line', { class: 'crosshair', y1: margin.top, y2: margin.top + ih });
  root.append(crosshair);

  function onHover(i) {
    crosshair.setAttribute('x1', xAt(i));
    crosshair.setAttribute('x2', xAt(i));
    crosshair.classList.add('on');
    const rows = series
      .filter((s) => visible.has(s.id))
      .map((s) => `<div class="tip-row"><span class="k"><span class="swatch" style="background:${s.color}"></span>${esc(s.label)}</span><span class="v">${esc(formatY(s.values[i]))}${opts.unit ? ` ${esc(opts.unit)}` : ''}</span></div>`)
      .join('');
    const rect = root.getBoundingClientRect();
    const px = rect.left + (xAt(i) / width) * rect.width;
    const py = rect.top + margin.top;
    showTip(px, py, `<div class="tip-head">${esc(formatX(xLabels[i]))}</div>${rows}`);
  }
  root.addEventListener('pointerleave', () => { crosshair.classList.remove('on'); hideTip(); });

  container.innerHTML = '';
  container.append(root);

  if (series.length > 1 && opts.legend !== false) {
    const legend = document.createElement('div');
    legend.className = 'chart-legend';
    series.forEach((s) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.setAttribute('aria-pressed', 'true');
      btn.innerHTML = `<span class="swatch" style="background:${s.color}"></span>${esc(s.label)}`;
      btn.addEventListener('click', () => {
        if (visible.has(s.id)) { visible.delete(s.id); btn.setAttribute('aria-pressed', 'false'); }
        else { visible.add(s.id); btn.setAttribute('aria-pressed', 'true'); }
        draw();
      });
      legend.append(btn);
    });
    container.append(legend);
  }
}

/* =============================================================
   Ranked / grouped bar chart — vertical or horizontal.
   opts: { categories:[...], series:[{id,label,color,values}],
           horizontal, height, formatValue }
============================================================= */

export function barChart(container, opts) {
  const { categories, series } = opts;
  const horizontal = !!opts.horizontal;
  const formatValue = opts.formatValue || ((v) => String(v));
  const width = opts.width || container.clientWidth || 640;
  const perCat = horizontal ? 34 : 0;
  const height = opts.height || (horizontal ? Math.max(140, categories.length * perCat + 40) : 260);

  const margin = horizontal
    ? { top: 8, right: 56, bottom: 8, left: opts.leftLabelWidth || 128 }
    : { top: 16, right: 16, bottom: 34, left: 52 };
  const iw = width - margin.left - margin.right;
  const ih = height - margin.top - margin.bottom;

  const allVals = series.flatMap((s) => s.values);
  const rawMax = Math.max(...allVals, 0);
  const scaleMax = niceMax(rawMax * 1.15 || 1);

  const root = svg('svg', { viewBox: `0 0 ${width} ${height}`, class: 'chart', role: 'img' });

  const n = categories.length;
  const groupCount = series.length;
  const groupGap = 0.28; // fraction of a slot reserved as whitespace between categories

  if (horizontal) {
    const slot = ih / n;
    const barH = (slot * (1 - groupGap)) / groupCount;
    const gridCount = 4;
    for (let g = 0; g <= gridCount; g += 1) {
      const val = (scaleMax / gridCount) * g;
      const x = margin.left + (val / scaleMax) * iw;
      root.append(svg('line', { x1: x, x2: x, y1: margin.top, y2: margin.top + ih, class: 'grid-line' }));
    }
    categories.forEach((cat, ci) => {
      const yTop = margin.top + ci * slot + slot * (groupGap / 2);
      const label = svg('text', { x: margin.left - 10, y: yTop + (barH * groupCount) / 2 + 4, 'text-anchor': 'end', class: 'axis-label' });
      label.textContent = cat.label ?? cat;
      root.append(label);
      series.forEach((s, si) => {
        const v = s.values[ci] || 0;
        const w = (v / scaleMax) * iw;
        const y = yTop + si * barH;
        root.append(svg('rect', {
          x: margin.left, y: y + 1, width: Math.max(w, 0), height: Math.max(barH - 2, 1),
          rx: 4, fill: s.colors?.[ci] ?? s.color, class: 'bar',
        }));
        if (groupCount === 1 || si === groupCount - 1) {
          const t = svg('text', { x: margin.left + w + 8, y: y + barH / 2 + 4, class: 'value-label' });
          t.textContent = formatValue(v);
          root.append(t);
        }
      });
    });
  } else {
    const slot = iw / n;
    const barW = (slot * (1 - groupGap)) / groupCount;
    const gridCount = 4;
    for (let g = 0; g <= gridCount; g += 1) {
      const val = (scaleMax / gridCount) * g;
      const y = margin.top + ih - (val / scaleMax) * ih;
      root.append(svg('line', { x1: margin.left, x2: width - margin.right, y1: y, y2: y, class: 'grid-line' }));
      const t = svg('text', { x: margin.left - 10, y: y + 3, 'text-anchor': 'end', class: 'axis-label' });
      t.textContent = formatValue(val);
      root.append(t);
    }
    root.append(svg('line', { x1: margin.left, x2: width - margin.right, y1: margin.top + ih, y2: margin.top + ih, class: 'axis-line' }));
    categories.forEach((cat, ci) => {
      const xLeft = margin.left + ci * slot + slot * (groupGap / 2);
      const label = svg('text', { x: xLeft + (barW * groupCount) / 2, y: height - margin.bottom + 18, 'text-anchor': 'middle', class: 'axis-label' });
      label.textContent = cat.label ?? cat;
      root.append(label);
      series.forEach((s, si) => {
        const v = s.values[ci] || 0;
        const h = (v / scaleMax) * ih;
        const x = xLeft + si * barW;
        const y = margin.top + ih - h;
        root.append(svg('rect', {
          x: x + 1, y, width: Math.max(barW - 2, 1), height: Math.max(h, 0),
          rx: 4, fill: s.color, class: 'bar',
        }));
      });
    });
  }

  // per-bar hover: one invisible hit rect per rendered bar
  const bars = [...root.querySelectorAll('rect.bar')];
  let bi = 0;
  categories.forEach((cat, ci) => {
    series.forEach((s) => {
      const rect = bars[bi]; bi += 1;
      if (!rect) return;
      rect.style.cursor = 'crosshair';
      rect.addEventListener('pointerenter', (e) => {
        const r = rect.getBoundingClientRect();
        const swatchColor = s.colors?.[ci] ?? s.color;
        showTip(r.left + r.width / 2, r.top, `<div class="tip-head">${esc(cat.label ?? cat)}</div><div class="tip-row"><span class="k"><span class="swatch" style="background:${swatchColor}"></span>${esc(s.label)}</span><span class="v">${esc(formatValue(s.values[ci] || 0))}</span></div>`);
      });
      rect.addEventListener('pointerleave', hideTip);
    });
  });

  container.innerHTML = '';
  container.append(root);

  if (series.length > 1 && opts.legend !== false) {
    const legend = document.createElement('div');
    legend.className = 'chart-legend';
    series.forEach((s) => {
      legend.innerHTML += `<span><span class="swatch" style="background:${s.color}"></span>${esc(s.label)}</span>`;
    });
    container.append(legend);
  }
}

/* =============================================================
   100%-stacked single bar — for part-to-whole with <=4 segments
   (macro split). Always direct-labelled; no legend needed.
   opts: { segments:[{label,color,value}], height, unit }
============================================================= */

export function stackedBar100(container, opts) {
  const { segments } = opts;
  const width = opts.width || container.clientWidth || 480;
  const barH = opts.barHeight || 28;
  const height = opts.height || 64;
  const total = segments.reduce((t, s) => t + s.value, 0) || 1;

  const root = svg('svg', { viewBox: `0 0 ${width} ${height}`, class: 'chart', role: 'img' });
  let x = 0;
  segments.forEach((s) => {
    const w = (s.value / total) * width;
    root.append(svg('rect', { x, y: 0, width: Math.max(w - 2, 0), height: barH, rx: 4, fill: s.color, class: 'bar' }));
    x += w;
  });

  let lx = 0;
  segments.forEach((s) => {
    const w = (s.value / total) * width;
    const t = svg('text', { x: lx + w / 2, y: barH + 20, 'text-anchor': 'middle', class: 'axis-label' });
    t.textContent = `${s.label} ${Math.round((s.value / total) * 100)}%`;
    root.append(t);
    lx += w;
  });

  container.innerHTML = '';
  container.append(root);
}
