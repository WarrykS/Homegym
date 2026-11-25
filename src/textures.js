// Textures procédurales des murs, sols et écrans (aucune image externe).
import * as THREE from 'three';
import { V3, DEG, UP, WALL_T, ISO_POLAR, STORE_KEY, SIDES, SIDE_NAME, SIDE_FROM, clamp, uid, cm, snap, esc, euro, num, cssVar } from './util.js';

/* ---------------------------------------------------------------------------
   Textures procédurales (aucune image externe)
--------------------------------------------------------------------------- */
export function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
}
export function hashStr(str) { let h = 2166136261; for (const c of str) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; }
export function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
export function grain(c, w, h, amt, r) {
  const im = c.getImageData(0, 0, w, h), d = im.data;
  for (let i = 0; i < d.length; i += 4) { const n = (r() - 0.5) * amt; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  c.putImageData(im, 0, 0);
}
export function blotches(c, w, h, n, r, rgb, aMax, rMax) {
  for (let i = 0; i < n; i++) {
    const x = r() * w, y = r() * h, rad = rMax * (0.3 + r());
    const g = c.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, `rgba(${rgb},${(aMax * r()).toFixed(3)})`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    c.fillStyle = g; c.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
}
export function drawBrick(c, w, h, r, p) {
  c.fillStyle = p.mortar; c.fillRect(0, 0, w, h); grain(c, w, h, 16, r);
  const rows = 8, cols = 4, ch = h / rows, bw = w / cols, m = Math.max(3, ch * 0.14);
  for (let y = 0; y < rows; y++) {
    const off = (y % 2) * bw / 2;
    for (let x = -1; x <= cols; x++) {
      const b = p.base[Math.floor(r() * p.base.length)], j = (r() - 0.5) * 22;
      c.fillStyle = `rgb(${b[0] + j},${b[1] + j * 0.8},${b[2] + j * 0.7})`;
      c.fillRect(x * bw + off + m / 2, y * ch + m / 2, bw - m, ch - m);
    }
  }
  for (let i = 0; i < 3000; i++) { c.fillStyle = `rgba(0,0,0,${(r() * 0.12).toFixed(3)})`; c.fillRect(r() * w, r() * h, 2, 2); }
  grain(c, w, h, 12, r);
}
export function drawConcreteWall(c, w, h, r) {
  c.fillStyle = '#a4a29d'; c.fillRect(0, 0, w, h);
  blotches(c, w, h, 50, r, '60,58,55', 0.16, w * 0.12);
  blotches(c, w, h, 30, r, '255,255,255', 0.12, w * 0.1);
  grain(c, w, h, 26, r);
  c.strokeStyle = 'rgba(40,40,40,.35)'; c.lineWidth = 2; c.strokeRect(1, 1, w - 2, h - 2);
  c.beginPath(); c.moveTo(w / 2, 0); c.lineTo(w / 2, h); c.moveTo(0, h / 2); c.lineTo(w, h / 2); c.stroke();
  for (const px of [0, w / 2]) for (const py of [0, h / 2]) for (const fx of [0.25, 0.75]) {
    const x = px + fx * w / 2, y = py + h / 4;
    const g = c.createRadialGradient(x, y, 0, x, y, 7);
    g.addColorStop(0, 'rgba(30,30,30,.85)'); g.addColorStop(0.6, 'rgba(60,60,60,.5)'); g.addColorStop(1, 'rgba(60,60,60,0)');
    c.fillStyle = g; c.fillRect(x - 8, y - 8, 16, 16);
  }
}
export function woodGrain(c, x0, y0, ww, hh, r, vertical, n = 30) {
  for (let k = 0; k < n; k++) {
    c.strokeStyle = `rgba(90,55,25,${(0.05 + r() * 0.13).toFixed(3)})`; c.lineWidth = 0.6 + r() * 1.6;
    c.beginPath();
    if (vertical) { const x = x0 + r() * ww, ph = r() * 6; for (let y = y0; y <= y0 + hh; y += 12) c.lineTo(x + Math.sin(y * 0.02 + ph) * 2.2, y); }
    else { const y = y0 + r() * hh, ph = r() * 6; for (let x = x0; x <= x0 + ww; x += 12) c.lineTo(x, y + Math.sin(x * 0.02 + ph) * 1.6); }
    c.stroke();
  }
}
export function drawLambris(c, w, h, r) {
  const n = 8, pw = w / n;
  for (let i = 0; i < n; i++) {
    const j = (r() - 0.5) * 26;
    c.fillStyle = `rgb(${196 + j},${150 + j * 0.8},${102 + j * 0.6})`; c.fillRect(i * pw, 0, pw, h);
    woodGrain(c, i * pw, 0, pw, h, r, true, 22);
    c.fillStyle = 'rgba(45,28,12,.6)'; c.fillRect(i * pw, 0, 2, h);
  }
  grain(c, w, h, 8, r);
}
export function drawOSB(c, w, h, r) {
  c.fillStyle = '#c8a46c'; c.fillRect(0, 0, w, h);
  const tones = [[214, 178, 120], [186, 146, 92], [160, 118, 70], [226, 196, 140], [140, 100, 60]];
  for (let i = 0; i < 2600; i++) {
    const t = tones[Math.floor(r() * tones.length)];
    c.save(); c.translate(r() * w, r() * h); c.rotate((r() - 0.5) * 0.9);
    c.fillStyle = `rgba(${t[0]},${t[1]},${t[2]},.7)`; c.fillRect(-15 - r() * 14, -3 - r() * 4, 22 + r() * 30, 5 + r() * 8);
    c.restore();
  }
  grain(c, w, h, 14, r);
  c.strokeStyle = 'rgba(60,40,20,.7)'; c.lineWidth = 3; c.strokeRect(1.5, 1.5, w - 3, h - 3);
}
export function drawMetro(c, w, h, r) {
  c.fillStyle = '#c9c9c4'; c.fillRect(0, 0, w, h);
  const rows = 8, cols = 4, th = h / rows, tw = w / cols, m = 3;
  for (let y = 0; y < rows; y++) {
    const off = (y % 2) * tw / 2;
    for (let x = -1; x <= cols; x++) {
      const X = x * tw + off + m / 2, Y = y * th + m / 2;
      const g = c.createLinearGradient(X, Y, X, Y + th - m);
      const j = Math.floor((r() - 0.5) * 8);
      g.addColorStop(0, `rgb(${252 + j},${252 + j},${249 + j})`); g.addColorStop(1, `rgb(${236 + j},${236 + j},${232 + j})`);
      c.fillStyle = g; c.fillRect(X, Y, tw - m, th - m);
    }
  }
}
export function drawRibs(c, w, h) {
  c.fillStyle = '#e6e6e6'; c.fillRect(0, 0, w, h);
  const per = w / 4;
  for (let i = 0; i < 4; i++) {
    const x = i * per, rw = per * 0.32;
    const g = c.createLinearGradient(x, 0, x + rw, 0);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.15, '#f7f7f7'); g.addColorStop(0.5, '#cfcfcf'); g.addColorStop(0.85, '#8e8e8e'); g.addColorStop(1, '#bdbdbd');
    c.fillStyle = g; c.fillRect(x, 0, rw, h);
    c.fillStyle = 'rgba(0,0,0,.06)'; c.fillRect(x + per * 0.62, 0, 2, h);
  }
}
export function drawFoam(c, w, h) {
  const s = w / 2;
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
    const vert = (i + j) % 2 === 0, x0 = i * s, y0 = j * s, n = 5, st = s / n;
    for (let k = 0; k < n; k++) {
      const g = vert ? c.createLinearGradient(x0 + k * st, 0, x0 + (k + 1) * st, 0) : c.createLinearGradient(0, y0 + k * st, 0, y0 + (k + 1) * st);
      g.addColorStop(0, '#f0f0f0'); g.addColorStop(0.5, '#bdbdbd'); g.addColorStop(1, '#6a6a6a');
      c.fillStyle = g;
      if (vert) c.fillRect(x0 + k * st, y0, st, s); else c.fillRect(x0, y0 + k * st, s, st);
    }
    c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 2; c.strokeRect(x0 + 1, y0 + 1, s - 2, s - 2);
  }
}
export function drawRubber(c, w, h, r) {
  c.fillStyle = '#d6d6d6'; c.fillRect(0, 0, w, h); grain(c, w, h, 22, r);
  const cols = ['#ffffff', '#9a9a9a', '#5a5a5a', '#f2f2f2'];
  for (let i = 0; i < 4200; i++) { c.fillStyle = cols[Math.floor(r() * cols.length)]; const s = 1 + r() * 2.2; c.fillRect(r() * w, r() * h, s, s); }
  c.strokeStyle = 'rgba(0,0,0,.55)'; c.lineWidth = 3; c.strokeRect(1.5, 1.5, w - 3, h - 3);
}
export function drawPuzzle(c, w, h, r) {
  const s = w / 2, A = '#ececec', B = '#c2c2c2';
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) { c.fillStyle = (i + j) % 2 ? B : A; c.fillRect(i * s, j * s, s, s); }
  const rad = s * 0.075;
  const col = (i, j) => (((i % 2) + 2 + (j % 2) + 2) % 2 ? B : A);
  for (let i = 0; i <= 2; i++) for (let j = 0; j < 2; j++) for (let k = 0; k < 3; k++) {
    const y = j * s + s * (0.2 + k * 0.3), dir = k % 2 ? 1 : -1;
    c.fillStyle = col(dir > 0 ? i - 1 : i, j); c.beginPath(); c.arc(i * s + dir * rad * 0.7, y, rad, 0, Math.PI * 2); c.fill();
  }
  for (let j = 0; j <= 2; j++) for (let i = 0; i < 2; i++) for (let k = 0; k < 3; k++) {
    const x = i * s + s * (0.2 + k * 0.3), dir = k % 2 ? -1 : 1;
    c.fillStyle = col(i, dir > 0 ? j - 1 : j); c.beginPath(); c.arc(x, j * s + dir * rad * 0.7, rad, 0, Math.PI * 2); c.fill();
  }
  grain(c, w, h, 16, r);
  c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = 1.5; c.strokeRect(0, 0, s, s); c.strokeRect(s, s, s, s); c.strokeRect(s, 0, s, s); c.strokeRect(0, s, s, s);
}
export function drawEpoxy(c, w, h, r) {
  c.fillStyle = '#dcdcdc'; c.fillRect(0, 0, w, h);
  const cols = ['#2b2b2b', '#fafafa', '#8a8a8a', '#c9b9a0', '#555555'];
  for (let i = 0; i < 7000; i++) {
    c.fillStyle = cols[Math.floor(r() * cols.length)]; c.beginPath();
    const x = r() * w, y = r() * h, s = 1.5 + r() * 3.5;
    c.moveTo(x, y); c.lineTo(x + s, y + r() * s); c.lineTo(x + r() * s, y + s); c.fill();
  }
  grain(c, w, h, 8, r);
}
export function drawConcreteFloor(c, w, h, r) {
  c.fillStyle = '#aaa79f'; c.fillRect(0, 0, w, h);
  blotches(c, w, h, 60, r, '70,66,60', 0.14, w * 0.1);
  blotches(c, w, h, 30, r, '255,255,255', 0.1, w * 0.08);
  grain(c, w, h, 22, r);
  c.strokeStyle = 'rgba(40,38,35,.55)'; c.lineWidth = 3; c.strokeRect(1.5, 1.5, w - 3, h - 3);
}
export function drawParquet(c, w, h, r) {
  const rows = 8, ph = h / rows;
  for (let y = 0; y < rows; y++) {
    let x = -r() * w * 0.5;
    while (x < w) {
      const len = w * (0.3 + r() * 0.45), j = (r() - 0.5) * 30;
      c.fillStyle = `rgb(${190 + j},${146 + j * 0.8},${98 + j * 0.6})`; c.fillRect(x, y * ph, len, ph);
      woodGrain(c, x, y * ph, len, ph, r, false, 6);
      c.fillStyle = 'rgba(50,30,12,.55)'; c.fillRect(x, y * ph, 2, ph);
      x += len;
    }
    c.fillStyle = 'rgba(50,30,12,.5)'; c.fillRect(0, y * ph, w, 1.5);
  }
  grain(c, w, h, 8, r);
}
export function drawTurf(c, w, h, r) {
  c.fillStyle = '#3c7b33'; c.fillRect(0, 0, w, h);
  const cols = ['#2e6a28', '#4f9a43', '#6db35a', '#356f2e'];
  for (let i = 0; i < 9000; i++) { c.strokeStyle = cols[Math.floor(r() * cols.length)]; c.lineWidth = 1.2; c.beginPath(); const x = r() * w, y = r() * h; c.moveTo(x, y); c.lineTo(x + (r() - 0.5) * 3, y - 3 - r() * 4); c.stroke(); }
}

export function drawEnduit(c, w, h, r) {
  c.fillStyle = '#f2efe9'; c.fillRect(0, 0, w, h);
  blotches(c, w, h, 70, r, '120,110,95', 0.06, w * 0.12);
  for (let i = 0; i < 900; i++) {
    c.strokeStyle = `rgba(${r() < 0.5 ? '255,255,255' : '90,80,70'},${(0.05 + r() * 0.07).toFixed(3)})`; c.lineWidth = 1 + r() * 3;
    const x = r() * w, y = r() * h, a = r() * Math.PI, l = 10 + r() * 30;
    c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + Math.cos(a) * l * 0.5, y + Math.sin(a) * l * 0.2, x + Math.cos(a) * l, y + Math.sin(a) * l * 0.4); c.stroke();
  }
  grain(c, w, h, 10, r);
}
export function drawBoisClair(c, w, h, r) {
  const rows = 6, ph = h / rows;
  for (let y = 0; y < rows; y++) {
    let x = -r() * w * 0.4;
    while (x < w) {
      const len = w * (0.45 + r() * 0.5), j = (r() - 0.5) * 18;
      c.fillStyle = `rgb(${226 + j},${200 + j * 0.8},${160 + j * 0.6})`; c.fillRect(x, y * ph, len, ph);
      woodGrain(c, x, y * ph, len, ph, r, false, 5);
      c.fillStyle = 'rgba(110,80,45,.35)'; c.fillRect(x, y * ph, 1.5, ph);
      x += len;
    }
    c.fillStyle = 'rgba(110,80,45,.4)'; c.fillRect(0, y * ph, w, 2);
  }
  grain(c, w, h, 6, r);
}
export function drawBetonCire(c, w, h, r) {
  c.fillStyle = '#b9b6b0'; c.fillRect(0, 0, w, h);
  blotches(c, w, h, 90, r, '90,86,80', 0.1, w * 0.16);
  blotches(c, w, h, 60, r, '255,255,255', 0.1, w * 0.12);
  grain(c, w, h, 8, r);
}

export const WALL_SURF = {
  paint: { label: 'Peinture', color: '#e4e1db', size: [1, 1], rough: 0.95, draw: (c, w, h, r) => { c.fillStyle = '#fff'; c.fillRect(0, 0, w, h); grain(c, w, h, 10, r); } },
  brick: { label: 'Brique', color: '#ffffff', size: [0.9, 0.6], rough: 0.9, draw: (c, w, h, r) => drawBrick(c, w, h, r, { mortar: '#b9b1a5', base: [[150, 70, 50], [128, 58, 42], [166, 86, 60], [112, 52, 40]] }) },
  paintbrick: { label: 'Brique peinte', color: '#f1efea', size: [0.9, 0.6], rough: 0.9, draw: (c, w, h, r) => drawBrick(c, w, h, r, { mortar: '#cfccc6', base: [[238, 236, 232], [228, 226, 222], [246, 244, 240]] }) },
  concrete: { label: 'Béton banché', color: '#ffffff', size: [2.4, 1.2], rough: 0.92, draw: drawConcreteWall },
  wood: { label: 'Lambris bois', color: '#ffffff', size: [0.96, 0.96], rough: 0.75, draw: drawLambris },
  osb: { label: 'OSB', color: '#ffffff', size: [1.25, 2.5], rough: 0.85, draw: drawOSB },
  tiles: { label: 'Carrelage métro', color: '#ffffff', size: [0.6, 0.6], rough: 0.3, draw: drawMetro },
  metal: { label: 'Bac acier', color: '#c3c8ce', size: [1, 1], rough: 0.45, metal: 0.5, draw: drawRibs },
  foam: { label: 'Mousse acoustique', color: '#4a4d54', size: [0.5, 0.5], rough: 1, draw: drawFoam },
  enduit: { label: 'Enduit à la chaux', color: '#ffffff', size: [1.5, 1.5], rough: 0.95, draw: drawEnduit },
  boisclair: { label: 'Bardage bois clair', color: '#ffffff', size: [1.2, 0.9], rough: 0.7, draw: drawBoisClair },
  betoncire: { label: 'Béton ciré', color: '#ffffff', size: [2, 2], rough: 0.45, draw: drawBetonCire },
};
export const FLOOR_SURF = {
  rubber: { label: 'Dalles caoutchouc', color: '#2e2f33', size: [1, 1], rough: 0.88, draw: drawRubber },
  puzzle: { label: 'Puzzle EVA', color: '#4c525b', size: [1.2, 1.2], rough: 0.8, draw: drawPuzzle },
  epoxy: { label: 'Résine époxy', color: '#a3a8ae', size: [1.5, 1.5], rough: 0.32, draw: drawEpoxy },
  concrete: { label: 'Béton lissé', color: '#ffffff', size: [3, 3], rough: 0.7, draw: drawConcreteFloor },
  parquet: { label: 'Parquet chêne', color: '#ffffff', size: [1.2, 1.2], rough: 0.55, draw: drawParquet },
  turf: { label: 'Gazon synthétique', color: '#ffffff', size: [1, 1], rough: 1, draw: drawTurf },
  betoncire: { label: 'Béton ciré', color: '#ffffff', size: [2, 2], rough: 0.25, draw: drawBetonCire },
};

export const texCache = new Map();
export function surfTex(kind, key) {
  const defs = kind === 'floor' ? FLOOR_SURF : WALL_SURF;
  const def = defs[key];
  const ck = kind + ':' + key;
  if (texCache.has(ck)) return texCache.get(ck);
  const [sx, sy] = def.size;
  const W = 512, H = clamp(Math.round(512 * sy / sx), 128, 1024);
  const cv = makeCanvas(W, H);
  def.draw(cv.getContext('2d', { willReadFrequently: true }), W, H, rng(hashStr(ck)));
  const tex = new THREE.CanvasTexture(cv);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.repeat.set(1 / sx, 1 / sy);
  const out = { tex, canvas: cv };
  texCache.set(ck, out);
  return out;
}
export function swatchURL(kind, key, color) {
  const { canvas } = surfTex(kind, key);
  const c = makeCanvas(128, 80), x = c.getContext('2d');
  x.drawImage(canvas, 0, 0, canvas.width, Math.min(canvas.height, canvas.width * 0.625), 0, 0, 128, 80);
  x.globalCompositeOperation = 'multiply'; x.fillStyle = color; x.fillRect(0, 0, 128, 80);
  return c.toDataURL('image/png');
}

export function canvasTexture(w, h, draw) {
  const cv = makeCanvas(w, h); draw(cv.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
export let _grooveTex, _screenTex, _tvTex, _turfTex;
export const grooveTex = () => _grooveTex ||= canvasTexture(64, 128, (c, w, h) => {
  c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h);
  for (const f of [0.02, 0.34, 0.66]) { c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(0, f * h, w, 3); c.fillStyle = 'rgba(255,255,255,.9)'; c.fillRect(0, f * h + 3, w, 2); }
  c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(0, h - 2, w, 2);
});
export const screenTex = () => _screenTex ||= canvasTexture(256, 96, (c, w, h) => {
  c.fillStyle = '#04121c'; c.fillRect(0, 0, w, h);
  c.fillStyle = '#5ee0ff'; c.font = '600 44px "IBM Plex Mono", monospace'; c.textBaseline = 'middle'; c.fillText('12:45', 14, h / 2);
  c.fillStyle = '#f2b705'; c.font = '600 22px "IBM Plex Mono", monospace'; c.fillText('8,2', 170, 34); c.fillText('km/h', 170, 64);
});
export const tvTex = () => _tvTex ||= canvasTexture(512, 288, (c, w, h) => {
  const g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#0b0f1c'); g.addColorStop(1, '#1b0f24');
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  c.fillStyle = '#ffffff'; c.globalAlpha = 0.65; c.font = '700 30px "Big Shoulders Display", "Arial Narrow", sans-serif'; c.fillText('EMOM · ROUND 3 / 10', 28, 52);
  c.globalAlpha = 1; c.fillStyle = '#ffd23f'; c.font = '800 150px "Big Shoulders Display", "Arial Narrow", sans-serif'; c.fillText('00:42', 26, 200);
  const cols = ['#d7262e', '#1f5fd1', '#f2b705', '#1f9d55'];
  cols.forEach((col, i) => { c.fillStyle = col; c.fillRect(28 + i * 118, 238, i < 3 ? 108 : 52, 16); });
});
export const turfTex = () => _turfTex ||= (() => {
  const t = canvasTexture(256, 256, (c, w, h) => { drawTurf(c, w, h, rng(7)); c.fillStyle = 'rgba(255,255,255,.92)'; c.fillRect(0, 0, 10, h); c.fillRect(w - 10, 0, 10, h); c.fillRect(0, 0, w, 6); });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
})();
