/* ============================================================
   Target-muscle visual — a schematic body silhouette (front or
   back view, picked from the muscle group's `region`) with the
   selected region highlighted. Geometric, not anatomical art —
   the goal is "which part of the body does this train", at a
   glance, not a medical illustration.
   ============================================================ */

const NS = 'http://www.w3.org/2000/svg';
function svg(tag, attrs = {}) {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
}

/* Region shapes, hand-placed on a 200x420 canvas. Each muscle-group
   id maps to one or more shape descriptors on the relevant view. */
const FRONT_SHAPES = {
  shoulders: [
    { tag: 'circle', cx: 62, cy: 96, r: 15 },
    { tag: 'circle', cx: 138, cy: 96, r: 15 },
  ],
  chest: [
    { tag: 'path', d: 'M74,102 Q100,90 126,102 L126,140 Q100,152 74,140 Z' },
  ],
  arms: [
    { tag: 'rect', x: 44, y: 108, width: 20, height: 92, rx: 10 },
    { tag: 'rect', x: 136, y: 108, width: 20, height: 92, rx: 10 },
  ],
  core: [
    { tag: 'rect', x: 78, y: 144, width: 44, height: 70, rx: 12 },
  ],
  legs: [
    { tag: 'path', d: 'M78,216 Q76,300 70,392 L94,392 Q98,300 100,220 Z' },
    { tag: 'path', d: 'M122,216 Q124,300 130,392 L106,392 Q102,300 100,220 Z' },
  ],
};

const BACK_SHAPES = {
  back: [
    { tag: 'path', d: 'M62,96 Q100,82 138,96 L134,150 Q100,168 66,150 Z' },
    { tag: 'path', d: 'M70,150 Q100,164 130,150 L126,212 Q100,224 74,212 Z' },
  ],
  shoulders: [
    { tag: 'circle', cx: 60, cy: 98, r: 15 },
    { tag: 'circle', cx: 140, cy: 98, r: 15 },
  ],
  arms: [
    { tag: 'rect', x: 42, y: 108, width: 20, height: 92, rx: 10 },
    { tag: 'rect', x: 138, y: 108, width: 20, height: 92, rx: 10 },
  ],
  legs: [
    { tag: 'path', d: 'M78,216 Q76,300 70,392 L94,392 Q98,300 100,220 Z' },
    { tag: 'path', d: 'M122,216 Q124,300 130,392 L106,392 Q102,300 100,220 Z' },
  ],
};

function bodyOutline() {
  // one continuous, low-detail outline: head, torso, arms-suggestion, legs
  return svg('path', {
    d: 'M100,26 a18,18 0 1 0 0.1,0 Z M76,58 Q100,46 124,58 L134,150 Q124,216 100,224 Q76,216 66,150 Z M78,224 Q76,310 70,392 L94,392 Q98,310 100,228 Q102,310 106,392 L130,392 Q124,310 122,224 Z',
    fill: 'none', stroke: 'rgba(201,169,138,.34)', 'stroke-width': 1.4,
  });
}

/**
 * Render the body diagram. `region` is 'front' | 'back'; `activeId`
 * highlights that muscle group's shapes in the crimson series colour.
 */
export function renderMuscleMap(container, { region = 'front', activeId } = {}) {
  const shapes = region === 'back' ? BACK_SHAPES : FRONT_SHAPES;
  const root = svg('svg', { viewBox: '0 0 200 410', class: 'chart', style: 'max-width:220px', role: 'img', 'aria-label': `${region} body diagram highlighting ${activeId || 'no'} region` });

  root.append(bodyOutline());

  for (const [id, parts] of Object.entries(shapes)) {
    const on = id === activeId;
    const g = svg('g', {
      fill: on ? 'var(--crimson-lift)' : 'rgba(201,169,138,.16)',
      'fill-opacity': on ? '0.88' : '1',
      stroke: on ? 'var(--bronze-light)' : 'rgba(201,169,138,.3)',
      'stroke-width': on ? 1.5 : 1,
    });
    parts.forEach((p) => {
      const { tag, ...attrs } = p;
      g.append(svg(tag, attrs));
    });
    root.append(g);
  }

  const label = svg('text', { x: 100, y: 405, 'text-anchor': 'middle', class: 'axis-label' });
  label.textContent = region === 'back' ? 'Back view' : 'Front view';
  root.append(label);

  container.innerHTML = '';
  container.append(root);
}
