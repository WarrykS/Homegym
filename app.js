import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';

/* =========================================================================
   Home Gym Studio : implantation d'une salle de sport à la maison.
   Unités internes : mètres. Affichage : centimètres.
   Repère : x vers l'est, z vers le sud, y vers le haut. Le nord est en haut du plan.
   ========================================================================= */

const V3 = THREE.Vector3;
const DEG = Math.PI / 180;
const UP = new V3(0, 1, 0);
const WALL_T = 0.2;
const ISO_POLAR = Math.acos(1 / Math.sqrt(3));
const STORE_KEY = 'homegym-studio.v1';
const SIDES = ['N', 'E', 'S', 'W'];
const SIDE_NAME = { N: 'nord', E: 'est', S: 'sud', W: 'ouest' };
const SIDE_FROM = { N: "depuis l'angle ouest", S: "depuis l'angle ouest", E: "depuis l'angle nord", W: "depuis l'angle nord" };

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const uid = () => Math.random().toString(36).slice(2, 9);
const cm = (m) => Math.round(m * 100);
const snap = (v, s) => Math.round(v / s) * s;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const euro = (n) => Math.round(n).toLocaleString('fr-FR') + ' €';
const num = (v, def) => (Number.isFinite(+v) ? +v : def);
const cssVar = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

/* ---------------------------------------------------------------------------
   Textures procédurales (aucune image externe)
--------------------------------------------------------------------------- */
function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
}
function hashStr(str) { let h = 2166136261; for (const c of str) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; }
function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function grain(c, w, h, amt, r) {
  const im = c.getImageData(0, 0, w, h), d = im.data;
  for (let i = 0; i < d.length; i += 4) { const n = (r() - 0.5) * amt; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  c.putImageData(im, 0, 0);
}
function blotches(c, w, h, n, r, rgb, aMax, rMax) {
  for (let i = 0; i < n; i++) {
    const x = r() * w, y = r() * h, rad = rMax * (0.3 + r());
    const g = c.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, `rgba(${rgb},${(aMax * r()).toFixed(3)})`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    c.fillStyle = g; c.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
}
function drawBrick(c, w, h, r, p) {
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
function drawConcreteWall(c, w, h, r) {
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
function woodGrain(c, x0, y0, ww, hh, r, vertical, n = 30) {
  for (let k = 0; k < n; k++) {
    c.strokeStyle = `rgba(90,55,25,${(0.05 + r() * 0.13).toFixed(3)})`; c.lineWidth = 0.6 + r() * 1.6;
    c.beginPath();
    if (vertical) { const x = x0 + r() * ww, ph = r() * 6; for (let y = y0; y <= y0 + hh; y += 12) c.lineTo(x + Math.sin(y * 0.02 + ph) * 2.2, y); }
    else { const y = y0 + r() * hh, ph = r() * 6; for (let x = x0; x <= x0 + ww; x += 12) c.lineTo(x, y + Math.sin(x * 0.02 + ph) * 1.6); }
    c.stroke();
  }
}
function drawLambris(c, w, h, r) {
  const n = 8, pw = w / n;
  for (let i = 0; i < n; i++) {
    const j = (r() - 0.5) * 26;
    c.fillStyle = `rgb(${196 + j},${150 + j * 0.8},${102 + j * 0.6})`; c.fillRect(i * pw, 0, pw, h);
    woodGrain(c, i * pw, 0, pw, h, r, true, 22);
    c.fillStyle = 'rgba(45,28,12,.6)'; c.fillRect(i * pw, 0, 2, h);
  }
  grain(c, w, h, 8, r);
}
function drawOSB(c, w, h, r) {
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
function drawMetro(c, w, h, r) {
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
function drawRibs(c, w, h) {
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
function drawFoam(c, w, h) {
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
function drawRubber(c, w, h, r) {
  c.fillStyle = '#d6d6d6'; c.fillRect(0, 0, w, h); grain(c, w, h, 22, r);
  const cols = ['#ffffff', '#9a9a9a', '#5a5a5a', '#f2f2f2'];
  for (let i = 0; i < 4200; i++) { c.fillStyle = cols[Math.floor(r() * cols.length)]; const s = 1 + r() * 2.2; c.fillRect(r() * w, r() * h, s, s); }
  c.strokeStyle = 'rgba(0,0,0,.55)'; c.lineWidth = 3; c.strokeRect(1.5, 1.5, w - 3, h - 3);
}
function drawPuzzle(c, w, h, r) {
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
function drawEpoxy(c, w, h, r) {
  c.fillStyle = '#dcdcdc'; c.fillRect(0, 0, w, h);
  const cols = ['#2b2b2b', '#fafafa', '#8a8a8a', '#c9b9a0', '#555555'];
  for (let i = 0; i < 7000; i++) {
    c.fillStyle = cols[Math.floor(r() * cols.length)]; c.beginPath();
    const x = r() * w, y = r() * h, s = 1.5 + r() * 3.5;
    c.moveTo(x, y); c.lineTo(x + s, y + r() * s); c.lineTo(x + r() * s, y + s); c.fill();
  }
  grain(c, w, h, 8, r);
}
function drawConcreteFloor(c, w, h, r) {
  c.fillStyle = '#aaa79f'; c.fillRect(0, 0, w, h);
  blotches(c, w, h, 60, r, '70,66,60', 0.14, w * 0.1);
  blotches(c, w, h, 30, r, '255,255,255', 0.1, w * 0.08);
  grain(c, w, h, 22, r);
  c.strokeStyle = 'rgba(40,38,35,.55)'; c.lineWidth = 3; c.strokeRect(1.5, 1.5, w - 3, h - 3);
}
function drawParquet(c, w, h, r) {
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
function drawTurf(c, w, h, r) {
  c.fillStyle = '#3c7b33'; c.fillRect(0, 0, w, h);
  const cols = ['#2e6a28', '#4f9a43', '#6db35a', '#356f2e'];
  for (let i = 0; i < 9000; i++) { c.strokeStyle = cols[Math.floor(r() * cols.length)]; c.lineWidth = 1.2; c.beginPath(); const x = r() * w, y = r() * h; c.moveTo(x, y); c.lineTo(x + (r() - 0.5) * 3, y - 3 - r() * 4); c.stroke(); }
}

const WALL_SURF = {
  paint: { label: 'Peinture', color: '#e4e1db', size: [1, 1], rough: 0.95, draw: (c, w, h, r) => { c.fillStyle = '#fff'; c.fillRect(0, 0, w, h); grain(c, w, h, 10, r); } },
  brick: { label: 'Brique', color: '#ffffff', size: [0.9, 0.6], rough: 0.9, draw: (c, w, h, r) => drawBrick(c, w, h, r, { mortar: '#b9b1a5', base: [[150, 70, 50], [128, 58, 42], [166, 86, 60], [112, 52, 40]] }) },
  paintbrick: { label: 'Brique peinte', color: '#f1efea', size: [0.9, 0.6], rough: 0.9, draw: (c, w, h, r) => drawBrick(c, w, h, r, { mortar: '#cfccc6', base: [[238, 236, 232], [228, 226, 222], [246, 244, 240]] }) },
  concrete: { label: 'Béton banché', color: '#ffffff', size: [2.4, 1.2], rough: 0.92, draw: drawConcreteWall },
  wood: { label: 'Lambris bois', color: '#ffffff', size: [0.96, 0.96], rough: 0.75, draw: drawLambris },
  osb: { label: 'OSB', color: '#ffffff', size: [1.25, 2.5], rough: 0.85, draw: drawOSB },
  tiles: { label: 'Carrelage métro', color: '#ffffff', size: [0.6, 0.6], rough: 0.3, draw: drawMetro },
  metal: { label: 'Bac acier', color: '#c3c8ce', size: [1, 1], rough: 0.45, metal: 0.5, draw: drawRibs },
  foam: { label: 'Mousse acoustique', color: '#4a4d54', size: [0.5, 0.5], rough: 1, draw: drawFoam },
};
const FLOOR_SURF = {
  rubber: { label: 'Dalles caoutchouc', color: '#2e2f33', size: [1, 1], rough: 0.88, draw: drawRubber },
  puzzle: { label: 'Puzzle EVA', color: '#4c525b', size: [1.2, 1.2], rough: 0.8, draw: drawPuzzle },
  epoxy: { label: 'Résine époxy', color: '#a3a8ae', size: [1.5, 1.5], rough: 0.32, draw: drawEpoxy },
  concrete: { label: 'Béton lissé', color: '#ffffff', size: [3, 3], rough: 0.7, draw: drawConcreteFloor },
  parquet: { label: 'Parquet chêne', color: '#ffffff', size: [1.2, 1.2], rough: 0.55, draw: drawParquet },
  turf: { label: 'Gazon synthétique', color: '#ffffff', size: [1, 1], rough: 1, draw: drawTurf },
};

const texCache = new Map();
function surfTex(kind, key) {
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
function swatchURL(kind, key, color) {
  const { canvas } = surfTex(kind, key);
  const c = makeCanvas(128, 80), x = c.getContext('2d');
  x.drawImage(canvas, 0, 0, canvas.width, Math.min(canvas.height, canvas.width * 0.625), 0, 0, 128, 80);
  x.globalCompositeOperation = 'multiply'; x.fillStyle = color; x.fillRect(0, 0, 128, 80);
  return c.toDataURL('image/png');
}

function canvasTexture(w, h, draw) {
  const cv = makeCanvas(w, h); draw(cv.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
let _grooveTex, _screenTex, _tvTex, _turfTex;
const grooveTex = () => _grooveTex ||= canvasTexture(64, 128, (c, w, h) => {
  c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h);
  for (const f of [0.02, 0.34, 0.66]) { c.fillStyle = 'rgba(0,0,0,.35)'; c.fillRect(0, f * h, w, 3); c.fillStyle = 'rgba(255,255,255,.9)'; c.fillRect(0, f * h + 3, w, 2); }
  c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(0, h - 2, w, 2);
});
const screenTex = () => _screenTex ||= canvasTexture(256, 96, (c, w, h) => {
  c.fillStyle = '#04121c'; c.fillRect(0, 0, w, h);
  c.fillStyle = '#5ee0ff'; c.font = '600 44px "IBM Plex Mono", monospace'; c.textBaseline = 'middle'; c.fillText('12:45', 14, h / 2);
  c.fillStyle = '#f2b705'; c.font = '600 22px "IBM Plex Mono", monospace'; c.fillText('8,2', 170, 34); c.fillText('km/h', 170, 64);
});
const tvTex = () => _tvTex ||= canvasTexture(512, 288, (c, w, h) => {
  const g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#0b0f1c'); g.addColorStop(1, '#1b0f24');
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  c.fillStyle = '#ffffff'; c.globalAlpha = 0.65; c.font = '700 30px "Big Shoulders Display", "Arial Narrow", sans-serif'; c.fillText('EMOM · ROUND 3 / 10', 28, 52);
  c.globalAlpha = 1; c.fillStyle = '#ffd23f'; c.font = '800 150px "Big Shoulders Display", "Arial Narrow", sans-serif'; c.fillText('00:42', 26, 200);
  const cols = ['#d7262e', '#1f5fd1', '#f2b705', '#1f9d55'];
  cols.forEach((col, i) => { c.fillStyle = col; c.fillRect(28 + i * 118, 238, i < 3 ? 108 : 52, 16); });
});
const turfTex = () => _turfTex ||= (() => {
  const t = canvasTexture(256, 256, (c, w, h) => { drawTurf(c, w, h, rng(7)); c.fillStyle = 'rgba(255,255,255,.92)'; c.fillRect(0, 0, 10, h); c.fillRect(w - 10, 0, 10, h); c.fillRect(0, 0, w, 6); });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
})();

/* ---------------------------------------------------------------------------
   Matériaux et petites briques de modélisation
--------------------------------------------------------------------------- */
let envTex = null;
const matCache = new Map();
function M(color, rough = 0.6, metal = 0, extra = null) {
  const key = color + '|' + rough + '|' + metal + '|' + (extra ? JSON.stringify(extra) : '');
  let m = matCache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, ...(extra || {}) });
    if (metal > 0.3) m.envMap = envTex;
    matCache.set(key, m);
  }
  return m;
}
const CHROME = () => M('#d7dbe0', 0.18, 1);
const DARK = () => M('#141517', 0.8, 0);
function mesh(geo, mat, x = 0, y = 0, z = 0) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; return m; }
function bx(w, h, d, mat, x, y, z) { return mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z); }
function rb(w, h, d, r, mat, x, y, z) { return mesh(new RoundedBoxGeometry(w, h, d, 3, Math.min(r, h / 2 - 0.001, w / 2 - 0.001, d / 2 - 0.001)), mat, x, y, z); }
function cy(r, len, mat, axis = 'y', x = 0, y = 0, z = 0, seg = 20, rTop = r) {
  const g = new THREE.CylinderGeometry(rTop, r, len, seg);
  if (axis === 'x') g.rotateZ(Math.PI / 2); else if (axis === 'z') g.rotateX(Math.PI / 2);
  return mesh(g, mat, x, y, z);
}
function beam(a, b, r, mat, seg = 10) {
  const A = new V3(...a), B = new V3(...b), len = A.distanceTo(B);
  const m = mesh(new THREE.CylinderGeometry(r, r, len, seg), mat);
  m.position.copy(A).add(B).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(UP, B.clone().sub(A).normalize());
  return m;
}
function slab(a, b, wid, thick, mat, rounded = 0) {
  const A = new V3(...a), B = new V3(...b), len = A.distanceTo(B);
  const m = rounded ? rb(wid, thick, len, rounded, mat) : bx(wid, thick, len, mat);
  m.position.copy(A).add(B).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new V3(0, 0, 1), B.clone().sub(A).normalize());
  return m;
}

const PLATES = { 25: ['#d7262e', 0.225, 0.066], 20: ['#1f5fd1', 0.225, 0.056], 15: ['#f2b705', 0.225, 0.046], 10: ['#1f9d55', 0.225, 0.036], 5: ['#f1f1ef', 0.115, 0.03] };
function plate(kg, axis = 'x') {
  const [c, r, t] = PLATES[kg];
  const g = new THREE.Group();
  g.add(cy(r, t, M(c, 0.55), axis, 0, 0, 0, 36));
  g.add(cy(0.032, t + 0.004, CHROME(), axis, 0, 0, 0, 16));
  return g;
}
function barbell(plates = []) {
  const g = new THREE.Group(), ch = CHROME();
  g.add(cy(0.014, 1.31, ch, 'x', 0, 0, 0, 12));
  for (const s of [-1, 1]) {
    g.add(cy(0.027, 0.03, ch, 'x', s * 0.67, 0, 0, 16));
    g.add(cy(0.025, 0.415, ch, 'x', s * 0.8925, 0, 0, 16));
    let x = 0.69;
    for (const kg of plates) { const t = PLATES[kg][2], p = plate(kg); p.position.x = s * (x + t / 2); g.add(p); x += t + 0.002; }
  }
  return g;
}
function dumbbell(r) {
  const g = new THREE.Group(), len = 0.04 + r * 0.9, dk = M('#1a1b1d', 0.7);
  g.add(cy(0.016, 0.15, CHROME(), 'z', 0, 0, 0, 10));
  for (const s of [-1, 1]) g.add(cy(r, len, dk, 'z', 0, 0, s * (0.075 + len / 2), 6));
  return g;
}
const KB = [[8, '#e85d9e'], [12, '#2f6fd6'], [16, '#f2b705'], [20, '#7b4bc4'], [24, '#1f9d55'], [28, '#f07f22'], [32, '#d7262e']];
function kettlebell(kg, color) {
  const g = new THREE.Group(), s = 0.07 + (kg - 8) * 0.0022, m = M(color, 0.5);
  const ball = mesh(new THREE.SphereGeometry(s, 20, 14), m, 0, s * 0.95, 0); ball.scale.y = 0.95; g.add(ball);
  g.add(mesh(new THREE.TorusGeometry(s * 0.62, 0.016, 8, 20), M('#2a2b2e', 0.45, 0.4), 0, s * 1.7, 0));
  return g;
}
function screenMesh(w, h) {
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), M('#000000', 0.4, 0, { emissive: '#ffffff', emissiveMap: screenTex(), emissiveIntensity: 1.2 }));
}

/* ---------------------------------------------------------------------------
   Catalogue : chaque modèle est construit à partir de ses dimensions (w, d, h)
   L'avant de chaque machine est vers +z local.
--------------------------------------------------------------------------- */
const CATS = {
  force: { label: 'Force', color: '#d7262e' },
  libre: { label: 'Charges libres', color: '#1f5fd1' },
  cardio: { label: 'Cardio', color: '#f2b705' },
  sol: { label: 'Sol et fonctionnel', color: '#1f9d55' },
  deco: { label: 'Confort et déco', color: '#8f98a3' },
};

function buildRack(it) {
  const g = new THREE.Group(), { w, d, h } = it, fr = M(it.color, 0.45, 0.35), zinc = M('#a3a9b0', 0.35, 0.7), p = 0.075;
  const xs = [-w / 2 + p / 2, w / 2 - p / 2], zs = [-d / 2 + p / 2, d / 2 - p / 2];
  for (const x of xs) {
    const sx = Math.sign(x);
    for (const z of zs) g.add(bx(p, h, p, fr, x, h / 2, z));
    g.add(bx(p, 0.05, d, fr, x, 0.025, 0));
    g.add(bx(p, p, d, fr, x, h - p / 2, 0));
    g.add(bx(0.06, 0.11, 0.12, fr, x, 1.38, zs[1] + 0.075));
    g.add(bx(0.05, 0.05, d + 0.12, zinc, x - sx * 0.068, 0.62, 0.02));
    g.add(cy(0.025, 0.22, fr, 'x', x + sx * 0.14, 0.45, zs[0], 12));
    const pl = plate(20); pl.position.set(x + sx * 0.14, 0.45, zs[0]); g.add(pl);
  }
  for (const z of zs) g.add(bx(w, p, p, fr, 0, h - p / 2, z));
  g.add(bx(w, 0.05, p, fr, 0, 0.025, zs[0]));
  for (const x of xs) g.add(bx(0.05, 0.05, 0.16, fr, x, h - 0.17, zs[1] + 0.08));
  g.add(cy(0.016, w + 0.12, CHROME(), 'x', 0, h - 0.17, zs[1] + 0.13, 14));
  const bb = barbell([20, 10]); bb.position.set(0, 1.46, zs[1] + 0.085); g.add(bb);
  return g;
}
// Atletica R8 Drift : cage 123 × 123 cm + section centrale ouverte de 108 cm + demi-tour à poulie de 30 cm.
// La tour est une colonne unique en bout de rack, avec un bras de tirage vertical en haut, une poulie réglable,
// et à sa base (côté cage) la charge : chariot à disques, ou pile de 95 kg pour la version PRO (it.variant = 'stack').
// Hauteur 226 cm, tubes 75 × 75 mm. Tour à droite (x+) sauf si it.flip.
function buildR8Drift(it) {
  const outer = new THREE.Group(), g = new THREE.Group(); outer.add(g);
  if (it.flip) g.scale.x = -1;
  const { w, d, h } = it, fr = M(it.color, 0.45, 0.35), zinc = M('#a3a9b0', 0.35, 0.7), ch = CHROME(), dk = DARK(), p = 0.075;
  const white = M('#e9e9e6', 0.4), cable = M('#111214', 0.6);
  const half = Math.min(0.3, w * 0.12), cw = Math.min(1.23, (w - half) * 0.55), x0 = -w / 2;
  const xc = [x0 + p / 2, x0 + cw - p / 2];
  const zs = [-d / 2 + p / 2, d / 2 - p / 2];
  const ch_h = h - 0.04;
  // ---- cage
  for (const x of xc) {
    const inner = x < xc[1] ? 1 : -1;
    for (const z of zs) g.add(bx(p, ch_h, p, fr, x, ch_h / 2, z));
    g.add(bx(p + 0.03, 0.04, d + 0.06, fr, x, 0.02, 0));
    g.add(bx(p, p, d, fr, x, ch_h - p / 2, 0));
    g.add(bx(0.06, 0.11, 0.12, fr, x, 1.38, zs[1] + 0.075));
    g.add(bx(0.06, 0.11, 0.12, fr, x, 1.0, zs[0] + 0.075));
    // bras de sécurité vers l'avant (accessoires avant, hors profondeur de 123 cm)
    g.add(bx(0.06, 0.06, 0.5, zinc, x, 0.55, zs[1] + 0.29));
    g.add(bx(0.05, 0.05, d - 0.12, zinc, x + inner * 0.068, 0.62, 0));
  }
  for (const z of zs) g.add(bx(cw, p, p, fr, x0 + cw / 2, ch_h - p / 2, z));
  g.add(bx(cw, 0.04, p, fr, x0 + cw / 2, 0.02, zs[0]));
  // barre de traction multiprises en avancée à l'avant
  const pz = zs[1] + 0.2, py = ch_h - 0.02;
  for (const x of xc) g.add(bx(0.05, 0.05, 0.26, fr, x, py, zs[1] + 0.1));
  g.add(cy(0.016, cw + 0.04, ch, 'x', x0 + cw / 2, py, pz, 14));
  for (const k of [0.3, 0.7]) g.add(beam([x0 + cw * k, py, pz], [x0 + cw * k + (k < 0.5 ? -0.08 : 0.08), py - 0.1, pz + 0.16], 0.016, ch));
  // porte-barres à l'arrière : deux barres rangées debout
  g.add(bx(0.12, 0.08, 0.16, fr, xc[0] + 0.02, 0.14, zs[0] - 0.02));
  for (const dx of [-0.03, 0.06]) g.add(cy(0.025, 2.0, ch, 'y', xc[0] + dx, 1.05, zs[0] - 0.04 + dx * 0.4, 12));
  const bb = barbell([20, 10]); bb.position.set(x0 + cw / 2, 1.46, zs[1] + 0.085); g.add(bb);

  // ---- liaison haute cage → tour (le milieu reste ouvert au sol)
  const colX = w / 2 - 0.05, colW = 0.09, tz = 0;
  g.add(bx(colX - xc[1], p, p, fr, (colX + xc[1]) / 2, h - 0.12, tz));

  // ---- tour à poulie
  g.add(bx(colW, h, colW, fr, colX, h / 2, tz));
  g.add(bx(0.12, 0.05, d, fr, colX, 0.025, 0));
  // bras de tirage vertical en haut, en avancée vers l'avant, avec ses poulies
  const armL = 0.6;
  g.add(slab([colX, h - 0.05, tz], [colX - 0.06, h - 0.02, tz + armL], 0.08, 0.08, fr));
  for (const k of [0.15, 0.5, 0.85]) g.add(cy(0.04, 0.02, white, 'x', colX - 0.06 * k, h + 0.01, tz + armL * k, 16));
  g.add(cy(0.045, 0.025, white, 'x', colX - 0.06, h - 0.1, tz + armL - 0.02, 18));
  g.add(cy(0.004, h - 0.1 - 1.78, cable, 'y', colX - 0.06, (h - 0.1 + 1.78) / 2, tz + armL - 0.02, 4));
  g.add(cy(0.014, 0.95, dk, 'x', colX - 0.06, 1.76, tz + armL - 0.02, 10));
  for (const s of [-1, 1]) g.add(cy(0.019, 0.14, M('#2a2b2e', 0.7), 'x', colX - 0.06 + s * 0.4, 1.76, tz + armL - 0.02, 10));
  // poulie réglable en hauteur sur la colonne, tournée vers l'avant
  g.add(bx(0.13, 0.2, 0.13, fr, colX, 1.15, tz + colW / 2 + 0.06));
  g.add(cy(0.045, 0.025, white, 'x', colX, 1.06, tz + colW / 2 + 0.14, 18));
  const hdl = mesh(new THREE.TorusGeometry(0.05, 0.011, 8, 18), dk, colX, 0.88, tz + colW / 2 + 0.16); hdl.rotation.y = Math.PI / 2; g.add(hdl);
  g.add(beam([colX, 1.02, tz + colW / 2 + 0.15], [colX, 0.93, tz + colW / 2 + 0.16], 0.004, cable, 4));
  // charge à la base, côté cage, entre deux tiges de guidage
  const sx = w / 2 - half + 0.11;
  for (const dz of [-0.13, 0.13]) g.add(cy(0.011, h - 0.3, ch, 'y', sx, (h - 0.3) / 2 + 0.05, tz + dz, 8));
  g.add(bx(0.24, 0.05, 0.4, fr, sx, 0.025, tz));
  g.add(bx(0.2, 0.04, 0.32, fr, sx, h - 0.27, tz));
  if (it.variant === 'stack') {
    const plt = M('#1b1c1f', 0.5, 0.4);
    for (let i = 0; i < 18; i++) g.add(bx(0.2, 0.022, 0.34, plt, sx, 0.08 + i * 0.025, tz));
    g.add(bx(0.21, 0.04, 0.35, fr, sx, 0.08 + 18 * 0.025 + 0.02, tz));
    g.add(cy(0.008, 0.08, M('#d7262e', 0.5), 'x', sx + 0.13, 0.08 + 9 * 0.025, tz, 8));
  } else {
    g.add(bx(0.18, 0.06, 0.3, fr, sx, 0.14, tz));
    g.add(cy(0.025, 0.62, ch, 'z', sx, 0.27, tz, 12));
    for (const s of [-1, 1]) for (let i = 0; i < 2; i++) { const pl = plate(i ? 10 : 20, 'z'); pl.position.set(sx, 0.27, tz + s * (0.12 + i * 0.05)); g.add(pl); }
  }
  // cale-pieds incliné devant la charge
  const foot = bx(0.34, 0.025, 0.3, M('#2a2b2e', 0.6, 0.3), sx - 0.04, 0.12, tz + 0.5); foot.rotation.x = 0.6; g.add(foot);
  g.add(bx(0.08, 0.05, 0.42, fr, sx - 0.04, 0.025, tz + 0.42));
  return outer;
}
// Atletica R8 Bradley Moyen à charge libre : cage 4 montants (75 × 75 mm) avec traverse renforcée à logo,
// barre de traction, J-hooks, bras de sécurité de 61 cm en avancée, et une colonne de poulie sur chaque côté :
// chariot à disques guidé par deux tiges, cornes de chargement vers l'extérieur, poulie réglable sur le montant avant.
function buildBradley(it) {
  const g = new THREE.Group(), { w, d, h } = it, fr = M(it.color, 0.45, 0.35), zinc = M('#a3a9b0', 0.35, 0.7), ch = CHROME(), dk = DARK(), p = 0.075;
  const white = M('#e9e9e6', 0.4), cable = M('#111214', 0.6);
  const xs = [-w / 2 + p / 2, w / 2 - p / 2], zs = [-d / 2 + p / 2, d / 2 - p / 2], uh = h - 0.05;
  for (const x of xs) {
    const out = Math.sign(x);
    for (const z of zs) { g.add(bx(p, uh, p, fr, x, uh / 2, z)); g.add(bx(0.12, 0.02, 0.24, fr, x, 0.01, z)); }
    g.add(bx(p, p, d, fr, x, h - p / 2, 0));
    // J-hooks et bras de sécurité (61 cm devant les montants avant)
    g.add(bx(0.06, 0.11, 0.12, fr, x, 1.38, zs[1] + 0.075));
    g.add(bx(0.07, 0.07, 0.61, zinc, x, 0.7, zs[1] + p / 2 + 0.305));
    g.add(bx(0.09, 0.05, 0.05, fr, x, 0.765, zs[1] + p / 2 + 0.58));
    // colonne de poulie latérale : deux tiges de guidage, chariot, cornes vers l'extérieur
    for (const dz of [-0.11, 0.11]) g.add(cy(0.011, uh - 0.25, ch, 'y', x, (uh - 0.25) / 2 + 0.08, dz, 8));
    g.add(bx(0.09, 0.04, 0.3, fr, x, 0.06, 0));
    g.add(bx(0.09, 0.04, 0.3, fr, x, uh - 0.2, 0));
    g.add(bx(0.1, 0.22, 0.26, fr, x, 0.28, 0));
    g.add(cy(0.025, 0.36, ch, 'x', x + out * 0.23, 0.32, 0, 12));
    for (let i = 0; i < 2; i++) { const pl = plate(i ? 10 : 20, 'x'); pl.position.set(x + out * (0.12 + i * 0.05), 0.32, 0); g.add(pl); }
    // poulies hautes et câble
    for (const z of [-0.05, zs[1] - 0.12]) g.add(cy(0.045, 0.025, white, 'x', x - out * 0.0, h - 0.13, z, 18));
    g.add(cy(0.004, uh - 0.2 - 0.45, cable, 'y', x, (uh - 0.2 + 0.45) / 2, -0.05, 4));
    g.add(beam([x, h - 0.13, -0.05], [x, h - 0.13, zs[1] - 0.12], 0.004, cable, 4));
    // poulie réglable sur le montant avant, tournée vers l'intérieur
    g.add(bx(0.13, 0.2, 0.13, fr, x - out * 0.1, 1.75, zs[1]));
    g.add(cy(0.045, 0.025, white, 'z', x - out * 0.17, 1.66, zs[1], 18));
    g.add(beam([x, h - 0.15, zs[1] - 0.06], [x - out * 0.1, 1.86, zs[1]], 0.004, cable, 4));
    g.add(beam([x - out * 0.17, 1.62, zs[1]], [x - out * 0.19, 1.45, zs[1]], 0.004, cable, 4));
    const hdl = mesh(new THREE.TorusGeometry(0.05, 0.011, 8, 18), dk, x - out * 0.19, 1.4, zs[1]); g.add(hdl);
  }
  // traverses hautes : renforcée avec logo à l'avant, simple à l'arrière ; barre de traction (monkey bar)
  g.add(bx(w, p, p, fr, 0, h - p / 2, zs[0]));
  g.add(bx(w - 2 * p, 0.16, 0.05, fr, 0, h - 0.11, zs[1]));
  g.add(bx(0.32, 0.035, 0.002, white, 0, h - 0.11, zs[1] + 0.027));
  g.add(bx(w, p, p, fr, 0, h - p / 2, zs[1]));
  for (const x of xs) g.add(bx(0.05, 0.05, 0.22, fr, x, h - 0.01, zs[1] + 0.1));
  g.add(cy(0.016, w + 0.06, ch, 'x', 0, h - 0.01, zs[1] + 0.2, 14));
  const bb = barbell([20, 10]); bb.position.set(0, 1.46, zs[1] + 0.085); g.add(bb);
  return g;
}
// Atletica R8 Duality long à charge libre : cage 123 × 123 cm à l'arrière + poulie vis-à-vis de 112 cm à l'avant.
// 6 montants de 226 cm : 4 pour la cage, 2 colonnes de poulie en bout. Chaque colonne a un chariot à disques
// (cornes vers l'extérieur), une poulie réglable tournée vers l'intérieur et un repose-pieds.
// Largeur 163 cm = cage 123 cm + 2 × 20 cm de supports latéraux.
function buildDuality(it) {
  const g = new THREE.Group(), { w, d, h } = it, fr = M(it.color, 0.45, 0.35), ch = CHROME(), dk = DARK(), p = 0.075;
  const white = M('#e9e9e6', 0.4), cable = M('#111214', 0.6), strap = M('#1f2023', 0.85);
  const cw = Math.min(1.23, w - 0.4), cd = Math.min(1.23, d * 0.52);
  const xs = [-cw / 2 + p / 2, cw / 2 - p / 2];
  const zb = -d / 2 + p / 2, zf = -d / 2 + cd - p / 2, zt = d / 2 - p / 2;
  for (const x of xs) {
    const out = Math.sign(x);
    for (const z of [zb, zf, zt]) g.add(bx(p, h, p, fr, x, h / 2, z));
    g.add(bx(p + 0.03, 0.04, cd + 0.06, fr, x, 0.02, -d / 2 + cd / 2));
    g.add(bx(p, p, d, fr, x, h - p / 2, 0));
    // cage : J-hooks, sangles de sécurité, support de barre latéral avec une barre debout
    g.add(bx(0.06, 0.11, 0.12, fr, x, 1.38, zf + 0.075));
    g.add(bx(0.05, 0.012, cd - 0.1, strap, x - out * 0.1, 0.72, -d / 2 + cd / 2));
    g.add(bx(0.2, 0.06, 0.12, fr, x + out * 0.13, 0.12, zb + 0.25));
    g.add(cy(0.025, 2.0, ch, 'y', x + out * 0.16, 1.07, zb + 0.25, 12));
    // colonne de poulie : pied, tiges de guidage, chariot à disques, poulie réglable
    g.add(bx(0.16, 0.04, 0.5, fr, x, 0.02, zt - 0.2));
    const zr = [zt - 0.13, zt - 0.33], zsl = (zr[0] + zr[1]) / 2;
    for (const z of zr) g.add(cy(0.011, h - 0.3, ch, 'y', x, (h - 0.3) / 2 + 0.08, z, 8));
    g.add(bx(0.08, 0.04, 0.3, fr, x, h - 0.2, zsl));
    g.add(bx(0.1, 0.2, 0.24, fr, x, 0.26, zsl));
    g.add(cy(0.025, 0.24, ch, 'x', x + out * 0.15, 0.3, zsl, 12));
    for (let i = 0; i < 2; i++) { const pl = plate(i ? 10 : 20, 'x'); pl.position.set(x + out * (0.1 + i * 0.05), 0.3, zsl); g.add(pl); }
    g.add(cy(0.045, 0.025, white, 'x', x, h - 0.13, zsl, 18));
    g.add(cy(0.004, h - 0.2 - 0.38, cable, 'y', x, (h - 0.2 + 0.38) / 2, zsl, 4));
    g.add(bx(0.13, 0.2, 0.13, fr, x - out * 0.1, 1.55, zt));
    g.add(cy(0.045, 0.025, white, 'z', x - out * 0.17, 1.46, zt, 18));
    g.add(beam([x - out * 0.17, 1.42, zt], [x - out * 0.2, 1.24, zt], 0.004, cable, 4));
    g.add(mesh(new THREE.TorusGeometry(0.05, 0.011, 8, 18), dk, x - out * 0.2, 1.19, zt));
    const foot = bx(0.3, 0.025, 0.26, M('#2a2b2e', 0.6, 0.3), x - out * 0.2, 0.1, zt - 0.25); foot.rotation.x = -0.5; g.add(foot);
  }
  // traverses hautes, barre multiprises côté cage, monkey bar entre les colonnes
  for (const z of [zb, zf, zt]) g.add(bx(cw, p, p, fr, 0, h - p / 2, z));
  g.add(cy(0.016, cw - 0.1, ch, 'x', 0, h - 0.16, zf - 0.13, 14));
  for (const k of [0.3, 0.7]) g.add(beam([-cw / 2 + cw * k, h - 0.16, zf - 0.13], [-cw / 2 + cw * k + (k < 0.5 ? -0.08 : 0.08), h - 0.28, zf - 0.27], 0.016, ch));
  for (const x of xs) g.add(bx(0.05, 0.05, 0.16, fr, x, h - 0.16, zf - 0.08));
  g.add(cy(0.016, cw + 0.04, ch, 'x', 0, h - 0.02, zt + 0.12, 14));
  for (const x of xs) g.add(bx(0.05, 0.05, 0.14, fr, x, h - 0.02, zt + 0.06));
  const bb = barbell([20, 10]); bb.position.set(0, 1.46, zf + 0.085); g.add(bb);
  return g;
}
// Atletica Predator : banc modulaire, poutre 110 × 60 mm, 150 × 65,5 × 46 cm, dossier 89,5 × 25 cm, assise 37 cm.
// Avec l'option EVO Arm (pupitre à biceps 63,5 × 71 × 75 cm) emboîtée côté assise (avant, +z).
const EVO_EXT = 0.45;
function buildPredator(it) {
  const g = new THREE.Group(), { w, d, h } = it, fr = M('#1c1d20', 0.45, 0.35), pad = M(it.color, 0.62), ch = CHROME(), dk = DARK();
  const L = it.evo ? d - EVO_EXT : d, zc = it.evo ? -EVO_EXT / 2 : 0, zf = zc + L / 2, zr = zc - L / 2;
  // poutre principale 110 × 60 mm et pieds
  g.add(bx(0.06, 0.11, L * 0.8, fr, 0, 0.17, zc));
  g.add(bx(w, 0.06, 0.08, fr, 0, 0.03, zf - 0.07));
  g.add(slab([0, 0.06, zf - 0.07], [0, 0.17, zf - 0.22], 0.06, 0.08, fr));
  g.add(bx(w * 0.7, 0.06, 0.08, fr, 0, 0.03, zr + 0.09));
  g.add(slab([0, 0.06, zr + 0.09], [0, 0.17, zr + 0.24], 0.06, 0.08, fr));
  for (const sx of [-1, 1]) g.add(cy(0.04, 0.035, dk, 'x', sx * w * 0.3, 0.04, zr + 0.03, 16));
  g.add(cy(0.015, 0.3, ch, 'z', 0, 0.2, zr - 0.06, 10));
  g.add(bx(0.07, 0.07, 0.12, fr, 0, 0.17, zr + 0.02));
  // assise et dossier (écart de 5,5 cm), réglage en échelle sous le dossier
  const py = h - 0.03, seatL = 0.37, backL = Math.min(0.895, L - seatL - 0.055 - 0.08);
  const zSeat = zf - 0.06 - seatL / 2, zBack = zSeat - seatL / 2 - 0.055 - backL / 2;
  g.add(rb(0.25, 0.06, seatL, 0.025, pad, 0, py, zSeat));
  g.add(rb(0.25, 0.06, backL, 0.025, pad, 0, py, zBack));
  g.add(bx(0.05, py - 0.2, 0.06, fr, 0, (py - 0.2) / 2 + 0.2, zSeat));
  g.add(bx(0.05, py - 0.2, 0.06, fr, 0, (py - 0.2) / 2 + 0.2, zBack - 0.1));
  g.add(slab([0, 0.23, zBack - 0.35], [0, 0.3, zBack + 0.2], 0.07, 0.03, fr));
  // récepteurs d'accessoires aux deux bouts
  g.add(bx(0.07, 0.07, 0.1, fr, 0, 0.17, zf - 0.02));
  if (it.evo) {
    // EVO Arm : montant dans le récepteur, pupitre incliné, levier avec poignée et corne à disques
    const zA = zf + 0.04;
    g.add(bx(0.07, 0.07, 0.2, fr, 0, 0.17, zA + 0.06));
    g.add(bx(0.07, 0.5, 0.07, fr, 0, 0.42, zA + 0.15));
    const desk = rb(0.5, 0.06, 0.34, 0.025, pad, 0, 0.66, zA + 0.24); desk.rotation.x = -0.75; g.add(desk);
    g.add(bx(0.4, 0.03, 0.05, fr, 0, 0.5, zA + 0.38));
    g.add(cy(0.035, 0.12, ch, 'x', 0, 0.55, zA + 0.44, 14));
    for (const sx of [-1, 1]) g.add(slab([sx * 0.26, 0.55, zA + 0.44], [sx * 0.26, 0.72, zA + 0.1], 0.04, 0.04, fr));
    g.add(cy(0.016, 0.62, ch, 'x', 0, 0.72, zA + 0.08, 12));
    g.add(cy(0.025, 0.2, ch, 'x', 0.38, 0.55, zA + 0.44, 12));
    const pl = plate(10, 'x'); pl.position.set(0.36, 0.55, zA + 0.44); g.add(pl);
  } else {
    g.add(bx(0.05, 0.05, 0.05, fr, 0, 0.17, zf + 0.04));
  }
  return g;
}
// Barre olympique Delta : 220 cm, manchons Ø 50 mm, posée au sol ou sur les J-hooks (hauteur de pose).
function buildOlyBar(it) {
  const g = new THREE.Group(), bb = barbell([]);
  bb.scale.x = it.w / 2.2; bb.position.y = 0.025; g.add(bb);
  return g;
}
// Barre EZ : 120 cm, poignée cintrée, manchons Ø 50 mm.
function buildEZ(it) {
  const g = new THREE.Group(), ch = CHROME(), k = it.w / 1.2, y = 0.025;
  const pts = [[-0.32, 0], [-0.22, 0], [-0.17, 0.035], [-0.12, -0.035], [-0.06, 0], [0.06, 0], [0.12, -0.035], [0.17, 0.035], [0.22, 0], [0.32, 0]];
  for (let i = 0; i < pts.length - 1; i++) g.add(beam([pts[i][0] * k, y, pts[i][1]], [pts[i + 1][0] * k, y, pts[i + 1][1]], 0.014, ch, 10));
  for (const sx of [-1, 1]) { g.add(cy(0.027, 0.03, ch, 'x', sx * 0.335 * k, y, 0, 16)); g.add(cy(0.025, 0.25 * k, ch, 'x', sx * (0.35 + 0.125) * k, y, 0, 16)); }
  return g;
}
// Set de disques bumper noirs 110 kg (4 × 20, 2 × 10, 2 × 5 kg) rangés debout sur un support.
function buildBumperSet(it) {
  const g = new THREE.Group(), { w, d } = it, fr = M('#1c1d20', 0.45, 0.35), blk = M('#1a1b1d', 0.75), ch = CHROME();
  for (const sz of [-1, 1]) g.add(bx(w, 0.04, 0.05, fr, 0, 0.02, sz * (d / 2 - 0.08)));
  for (const sx of [-1, 1]) g.add(bx(0.04, 0.12, d - 0.1, fr, sx * (w / 2 - 0.02), 0.06, 0));
  const set = [[20, 0.056], [20, 0.056], [20, 0.056], [20, 0.056], [10, 0.036], [10, 0.036], [5, 0.03], [5, 0.03]];
  const total = set.reduce((a, [, t]) => a + t + 0.025, 0);
  let x = -total / 2;
  for (const [, t] of set) {
    x += t / 2 + 0.0125;
    g.add(cy(0.225, t, blk, 'x', x, 0.245, 0, 40));
    g.add(cy(0.032, t + 0.003, ch, 'x', x, 0.245, 0, 16));
    x += t / 2 + 0.0125;
  }
  return g;
}
// Set L1 Olympia ×2 : deux haltères (barre 52 cm, manchons 17,5 cm) chargées de 47,5 kg de disques en fonte.
function buildL1Pair(it) {
  const g = new THREE.Group(), ch = CHROME(), iron = M('#2b2d31', 0.55, 0.45), k = it.w / 0.52;
  const discs = [[0.115, 0.024], [0.115, 0.024], [0.115, 0.024], [0.115, 0.024], [0.095, 0.02], [0.08, 0.016]];
  const r0 = discs[0][0];
  for (const sz of [-1, 1]) {
    const z = sz * (it.d / 2 - r0);
    g.add(cy(0.0125, 0.17 * k, ch, 'x', 0, r0, z, 10));
    for (const sx of [-1, 1]) {
      g.add(cy(0.025, 0.175 * k, ch, 'x', sx * (0.085 + 0.0875) * k, r0, z, 14));
      let x = 0.09 * k;
      for (const [r, t] of discs) { g.add(cy(r, t, iron, 'x', sx * (x + t / 2), r0, z, 28)); x += t + 0.002; }
      g.add(cy(0.035, 0.03, M('#c9ccd1', 0.35, 0.6), 'x', sx * (x + 0.015), r0, z, 14));
    }
  }
  return g;
}
function buildWallRack(it) {
  const g = new THREE.Group(), { w, d, h } = it, fr = M(it.color, 0.45, 0.35), p = 0.075;
  const xs = [-w / 2 + p / 2, w / 2 - p / 2], zb = -d / 2 + 0.02, zf = d / 2 - p / 2;
  for (const x of xs) {
    g.add(bx(p + 0.03, h, 0.04, fr, x, h / 2, zb));
    g.add(bx(p, h - 0.06, p, fr, x, (h - 0.06) / 2, zf));
    g.add(bx(p, p, d, fr, x, h - 0.12, 0));
    g.add(bx(0.06, 0.11, 0.12, fr, x, 1.38, zf + 0.075));
    g.add(bx(p + 0.02, 0.02, 0.18, fr, x, 0.01, zf));
  }
  g.add(bx(w, p, 0.04, fr, 0, h - 0.12, zb));
  g.add(cy(0.016, w + 0.1, CHROME(), 'x', 0, h - 0.12, zf + 0.07, 14));
  const bb = barbell([15]); bb.position.set(0, 1.46, zf + 0.085); g.add(bb);
  return g;
}
function buildBench(it) {
  const g = new THREE.Group(), { w, d, h } = it, fr = M('#1c1d20', 0.45, 0.35), pad = M(it.color, 0.62);
  g.add(bx(0.08, 0.07, d * 0.86, fr, 0, 0.09, 0));
  g.add(bx(w, 0.05, 0.07, fr, 0, 0.025, d / 2 - 0.06));
  g.add(bx(w * 0.85, 0.05, 0.07, fr, 0, 0.025, -d / 2 + 0.06));
  for (const s of [-1, 1]) g.add(cy(0.035, 0.03, DARK(), 'x', s * w * 0.36, 0.035, -d / 2 + 0.06, 14));
  const py = h - 0.035;
  g.add(bx(0.06, py - 0.12, 0.06, fr, 0, (py - 0.12) / 2 + 0.09, -0.15));
  g.add(bx(0.06, py - 0.12, 0.06, fr, 0, (py - 0.12) / 2 + 0.09, d / 2 - 0.26));
  const pw = Math.min(w, 0.3);
  g.add(rb(pw, 0.07, 0.38, 0.03, pad, 0, py, d / 2 - 0.22));
  g.add(rb(pw, 0.07, d - 0.46, 0.03, pad, 0, py, -0.2));
  g.add(cy(0.014, 0.25, M('#2a2b2e', 0.5), 'z', 0, 0.12, -d / 2 - 0.05, 10));
  return g;
}
function buildPlatform(it) {
  const g = new THREE.Group(), { w, d, h } = it;
  const cw = Math.min(1.22, w * 0.5), sw = (w - cw) / 2;
  const t = surfTex('floor', 'parquet').tex.clone(); t.needsUpdate = true; t.repeat.set(cw / 1.2, d / 1.2);
  const wood = new THREE.MeshStandardMaterial({ map: t, roughness: 0.6, color: '#f0dcc0' }); wood.userData.own = true;
  g.add(bx(cw, h, d, wood, 0, h / 2, 0));
  for (const s of [-1, 1]) g.add(bx(sw, h, d, M('#151618', 0.92), s * (cw / 2 + sw / 2), h / 2, 0));
  return g;
}
function buildDumbbells(it) {
  const g = new THREE.Group(), { w, d, h } = it, fr = M(it.color, 0.45, 0.35);
  for (const s of [-1, 1]) {
    const x = s * (w / 2 - 0.03);
    g.add(bx(0.05, h, 0.05, fr, x, h / 2, -d / 2 + 0.1));
    g.add(bx(0.05, h * 0.55, 0.05, fr, x, h * 0.275, d / 2 - 0.08));
    g.add(bx(0.05, 0.05, d, fr, x, 0.025, 0));
  }
  const tiers = [{ y: h - 0.05, z: -d / 2 + 0.2, r0: 0.042, r1: 0.06 }, { y: h * 0.48, z: d / 2 - 0.22, r0: 0.062, r1: 0.085 }];
  for (const t of tiers) {
    for (const dz of [-0.1, 0.1]) g.add(bx(w - 0.04, 0.03, 0.04, fr, 0, t.y, t.z + dz));
    const n = Math.max(2, Math.floor((w - 0.08) / 0.17));
    for (let i = 0; i < n; i++) {
      const r = t.r0 + (t.r1 - t.r0) * (i / Math.max(1, n - 1));
      const db = dumbbell(r); db.position.set(-w / 2 + 0.06 + (i + 0.5) * ((w - 0.12) / n), t.y + 0.015 + r, t.z); g.add(db);
    }
  }
  return g;
}
function buildKettlebells(it) {
  const g = new THREE.Group(), { w, d, h } = it, fr = M(it.color, 0.45, 0.35);
  for (const x of [-w / 2 + 0.02, w / 2 - 0.02]) for (const z of [-d / 2 + 0.02, d / 2 - 0.02]) g.add(bx(0.035, h, 0.035, fr, x, h / 2, z));
  const ys = [0.06, h * 0.55];
  ys.forEach((y, ti) => {
    g.add(bx(w, 0.03, d, M('#2a2c30', 0.7, 0.2), 0, y, 0));
    const n = Math.max(1, Math.floor((w - 0.04) / 0.27));
    for (let i = 0; i < n; i++) {
      const [kg, col] = KB[Math.min(KB.length - 1, ti === 0 ? 3 + i : i)];
      const k = kettlebell(kg, col); k.position.set(-w / 2 + (i + 0.5) * (w / n), y + 0.015, 0); g.add(k);
    }
  });
  return g;
}
function buildPlateTree(it) {
  const g = new THREE.Group(), { w, d, h } = it, fr = M(it.color, 0.45, 0.35);
  g.add(bx(w, 0.04, d, fr, 0, 0.02, 0));
  g.add(bx(0.07, h, 0.07, fr, 0, h / 2, 0));
  for (const [y, kgs] of [[0.3, [25, 20]], [0.78, [15, 10, 5]]]) {
    for (const s of [-1, 1]) {
      g.add(cy(0.025, 0.24, CHROME(), 'z', 0, y, s * 0.15, 12));
      let z = 0.05;
      for (const kg of kgs) { const t = PLATES[kg][2], p = plate(kg, 'z'); p.position.set(0, Math.max(y, PLATES[kg][1] + 0.05), s * (z + t / 2)); g.add(p); z += t + 0.004; }
    }
  }
  g.add(cy(0.03, 0.2, CHROME(), 'y', 0, h + 0.08, 0, 12));
  return g;
}
function buildTreadmill(it) {
  const g = new THREE.Group(), { w, d, h } = it, body = M(it.color, 0.5, 0.2), alu = M('#b9bec5', 0.35, 0.7);
  g.add(bx(w * 0.9, 0.16, d * 0.92, body, 0, 0.1, -0.02));
  g.add(bx(w * 0.62, 0.012, d * 0.78, M('#101113', 0.9), 0, 0.186, -0.05));
  for (const s of [-1, 1]) g.add(bx(w * 0.13, 0.03, d * 0.8, alu, s * w * 0.38, 0.19, -0.05));
  g.add(rb(w * 0.95, 0.28, 0.42, 0.06, body, 0, 0.16, d / 2 - 0.21));
  for (const s of [-1, 1]) {
    const x = s * (w / 2 - 0.06);
    g.add(bx(0.07, h - 0.32, 0.07, body, x, (h - 0.32) / 2 + 0.24, d / 2 - 0.2));
    g.add(cy(0.02, 0.55, M('#2a2b2e', 0.6), 'z', x, h - 0.3, d / 2 - 0.45, 12));
  }
  const con = rb(w * 0.9, 0.06, 0.32, 0.02, body, 0, h - 0.12, d / 2 - 0.2); con.rotation.x = -0.5; g.add(con);
  const scr = screenMesh(w * 0.42, 0.15); scr.position.set(0, 0.031, 0); scr.rotation.x = -Math.PI / 2; con.add(scr);
  return g;
}
function buildRower(it) {
  const g = new THREE.Group(), { w, d, h } = it, body = M(it.color, 0.5, 0.25), alu = M('#c4c8ce', 0.3, 0.75), dk = DARK();
  const fz = d / 2 - 0.28;
  g.add(cy(0.27, 0.2, body, 'x', 0, 0.47, fz, 36));
  g.add(cy(0.12, 0.205, M('#3a3c40', 0.5, 0.3), 'x', 0, 0.47, fz, 24));
  g.add(bx(w, 0.05, 0.12, body, 0, 0.025, d / 2 - 0.08));
  g.add(bx(0.1, 0.3, 0.14, body, 0, 0.18, d / 2 - 0.12));
  const zFront = fz - 0.22, zBack = -d / 2 + 0.08;
  g.add(slab([0, 0.42, zFront], [0, 0.32, zBack], 0.075, 0.05, alu));
  g.add(bx(w * 0.62, 0.05, 0.08, body, 0, 0.025, -d / 2 + 0.06));
  g.add(bx(0.08, 0.28, 0.08, body, 0, 0.16, -d / 2 + 0.08));
  g.add(rb(0.3, 0.06, 0.28, 0.02, dk, 0, 0.42, -0.15));
  for (const s of [-1, 1]) { const f = bx(0.12, 0.24, 0.03, dk, s * 0.09, 0.32, fz - 0.42); f.rotation.x = 0.6; g.add(f); }
  g.add(cy(0.014, 0.5, dk, 'x', 0, 0.56, fz - 0.3, 10));
  g.add(beam([0, 0.72, fz - 0.05], [0, h - 0.1, fz - 0.2], 0.014, dk));
  const mon = bx(0.22, 0.17, 0.04, dk, 0, h - 0.08, fz - 0.22); g.add(mon);
  const scr = screenMesh(0.17, 0.12); scr.position.set(0, 0, -0.021); scr.rotation.y = Math.PI; mon.add(scr);
  return g;
}
function buildBike(it) {
  const g = new THREE.Group(), { w, d, h } = it, fr = M(it.color, 0.45, 0.35), dk = DARK(), red = M('#c8202a', 0.5, 0.2);
  const fz = d / 2 - 0.33, fy = 0.45;
  const cage = mesh(new THREE.CylinderGeometry(0.33, 0.33, 0.16, 28, 2, true), M('#3a3c40', 0.6, 0.3, { wireframe: true }), 0, fy, fz); cage.rotation.z = Math.PI / 2; cage.castShadow = false; g.add(cage);
  for (const s of [-1, 1]) { const ring = mesh(new THREE.TorusGeometry(0.33, 0.012, 8, 40), fr, s * 0.08, fy, fz); ring.rotation.y = Math.PI / 2; g.add(ring); }
  const rotor = new THREE.Group(); rotor.position.set(0, fy, fz);
  for (let i = 0; i < 8; i++) { const b = bx(0.12, 0.26, 0.012, M('#2a2b2e', 0.6), 0, 0, 0); b.geometry.translate(0, 0.17, 0); b.rotation.x = (i / 8) * Math.PI * 2; b.rotation.y = 0.35; const piv = new THREE.Group(); piv.rotation.x = (i / 8) * Math.PI * 2; b.rotation.x = 0; piv.add(b); rotor.add(piv); }
  rotor.add(cy(0.07, 0.2, dk, 'x', 0, 0, 0, 16)); g.add(rotor);
  g.userData.ticks = [(t) => { rotor.rotation.x = t * 2.2; }];
  g.add(bx(w, 0.05, 0.1, fr, 0, 0.025, d / 2 - 0.1));
  g.add(bx(w * 0.8, 0.05, 0.1, fr, 0, 0.025, -d / 2 + 0.08));
  g.add(beam([0, fy, fz], [0, 0.3, -0.12], 0.035, fr));
  g.add(beam([0, 0.05, d / 2 - 0.1], [0, fy, fz], 0.03, fr));
  g.add(beam([0, 0.05, -d / 2 + 0.08], [0, 0.3, -0.12], 0.03, fr));
  g.add(beam([0, 0.28, -0.12], [0, h - 0.47, -0.3], 0.03, fr));
  g.add(rb(0.26, 0.08, 0.32, 0.03, dk, 0, h - 0.43, -0.32));
  for (const s of [-1, 1]) {
    g.add(beam([s * 0.17, 0.55, fz - 0.12], [s * 0.25, h - 0.06, fz - 0.42], 0.016, fr));
    g.add(cy(0.02, 0.13, dk, 'x', s * 0.29, h - 0.06, fz - 0.42, 10));
    g.add(bx(0.1, 0.025, 0.05, dk, s * 0.14, 0.24 + s * 0.08, -0.08 + s * 0.12));
  }
  g.add(cy(0.09, 0.03, red, 'x', 0.05, 0.32, -0.06, 20));
  g.add(beam([0, 0.6, fz - 0.15], [0, h - 0.2, fz - 0.32], 0.018, fr));
  const con = bx(0.2, 0.13, 0.05, dk, 0, h - 0.18, fz - 0.34); g.add(con);
  return g;
}
function buildCable(it) {
  const g = new THREE.Group(), { w, d, h } = it, fr = M(it.color, 0.45, 0.35), stack = M('#1b1c1f', 0.5, 0.4), ch = CHROME();
  for (const s of [-1, 1]) {
    const cx = s * (w / 2 - 0.22), zb = -d / 2 + 0.06;
    for (const dx of [-0.16, 0.16]) g.add(bx(0.07, h, 0.07, fr, cx + dx, h / 2, zb));
    g.add(bx(0.07, h, 0.07, fr, cx, h / 2, d / 2 - 0.22));
    g.add(bx(0.44, 0.05, d, fr, cx, 0.025, 0));
    g.add(bx(0.44, 0.07, d - 0.1, fr, cx, h - 0.035, -0.02));
    for (const dx of [-0.09, 0.09]) g.add(cy(0.01, h - 0.2, ch, 'y', cx + dx, h / 2, zb + 0.09, 8));
    for (let i = 0; i < 14; i++) g.add(bx(0.24, 0.032, 0.11, stack, cx, 0.08 + i * 0.037, zb + 0.09));
    g.add(bx(0.1, 0.2, 0.1, fr, cx, 1.85, d / 2 - 0.13));
    g.add(cy(0.05, 0.025, ch, 'x', cx, 1.78, d / 2 - 0.06, 18));
    g.add(mesh(new THREE.TorusGeometry(0.06, 0.012, 8, 18), DARK(), cx, 1.62, d / 2 - 0.05));
  }
  g.add(bx(w - 0.44, 0.07, 0.07, fr, 0, h - 0.035, 0.08));
  g.add(cy(0.016, w - 0.7, ch, 'x', 0, h - 0.2, 0.22, 14));
  for (const s of [-1, 1]) g.add(bx(0.05, 0.2, 0.05, fr, s * (w / 2 - 0.4), h - 0.12, 0.2));
  return g;
}
function buildLegpress(it) {
  const g = new THREE.Group(), { w, d, h } = it, fr = M(it.color, 0.45, 0.35), pad = M('#1b1b1d', 0.62);
  const rx = Math.min(0.45, w / 2 - 0.05);
  for (const s of [-1, 1]) g.add(bx(0.08, 0.08, d, fr, s * rx, 0.04, 0));
  for (const z of [-d / 2 + 0.04, d / 2 - 0.04]) g.add(bx(rx * 2 + 0.08, 0.08, 0.08, fr, 0, 0.04, z));
  g.add(bx(0.07, 0.36, 0.07, fr, 0, 0.22, -d / 2 + 0.55));
  g.add(rb(0.5, 0.08, 0.45, 0.03, pad, 0, 0.42, -d / 2 + 0.55));
  g.add(slab([0, 0.46, -d / 2 + 0.36], [0, 0.98, -d / 2 + 0.06], 0.5, 0.08, pad, 0.03));
  g.add(beam([0, 0.08, -d / 2 + 0.2], [0, 0.9, -d / 2 + 0.08], 0.03, fr));
  const a = new V3(0, 0.12, -0.25), b = new V3(0, h - 0.05, d / 2 - 0.08);
  for (const s of [-0.3, 0.3]) {
    g.add(slab([s, a.y, a.z], [s, b.y, b.z], 0.07, 0.07, fr));
    g.add(bx(0.07, h - 0.08, 0.07, fr, s, (h - 0.08) / 2 + 0.04, d / 2 - 0.08));
  }
  const p = a.clone().lerp(b, 0.42);
  const sled = new THREE.Group(); sled.position.copy(p); sled.rotation.x = Math.PI / 4; g.add(sled);
  sled.add(bx(0.74, 0.03, 0.55, M('#3a3c40', 0.5, 0.4), 0, -0.05, 0));
  for (const s of [-1, 1]) {
    sled.add(cy(0.025, 0.28, CHROME(), 'x', s * 0.5, 0.05, 0.1, 12));
    const pl = plate(20); pl.position.set(s * 0.45, 0.05, 0.1); sled.add(pl);
    const pl2 = plate(10); pl2.position.set(s * 0.51, 0.05, 0.1); sled.add(pl2);
  }
  return g;
}
function buildBag(it, ctx) {
  const g = new THREE.Group(), { w, h } = it, H = ctx.roomH;
  const top = Math.max(h + 0.3, H - 0.45);
  g.add(bx(0.14, 0.03, 0.14, M('#1c1d20', 0.45, 0.35), 0, H - 0.015, 0));
  const sway = new THREE.Group(); sway.position.y = H; g.add(sway);
  sway.add(cy(0.007, H - top, CHROME(), 'y', 0, -(H - top) / 2, 0, 6));
  sway.add(cy(w / 2, h, M(it.color, 0.55), 'y', 0, -(H - top) - h / 2, 0, 28));
  for (const yy of [-(H - top) - 0.03, -(H - top) - h + 0.03]) sway.add(cy(w / 2 + 0.004, 0.05, M('#141517', 0.5), 'y', 0, yy, 0, 28));
  g.userData.ticks = [(t) => { sway.rotation.x = Math.sin(t * 1.3) * 0.025; sway.rotation.z = Math.sin(t * 0.9 + 1) * 0.018; }];
  return g;
}
function buildMirror(it) {
  const g = new THREE.Group(), { w, d, h } = it, fr = M('#141517', 0.4, 0.3);
  g.add(bx(w, h, 0.012, fr, 0, h / 2, -d / 2 + 0.006));
  for (const y of [0.015, h - 0.015]) g.add(bx(w, 0.03, d, fr, 0, y, 0));
  for (const s of [-1, 1]) g.add(bx(0.03, h, d, fr, s * (w / 2 - 0.015), h / 2, 0));
  const gw = w - 0.06, gh = h - 0.06;
  const refl = new Reflector(new THREE.PlaneGeometry(gw, gh), {
    clipBias: 0.003, color: 0xb9bdc3,
    textureWidth: Math.round(1024 * Math.min(1, gw / gh)), textureHeight: Math.round(1024 * Math.min(1, gh / gw)),
  });
  refl.position.set(0, h / 2, -d / 2 + 0.014); refl.userData.reflector = true; g.add(refl);
  const fake = mesh(new THREE.PlaneGeometry(gw, gh), M('#dbe2e8', 0.05, 1), 0, h / 2, -d / 2 + 0.014); fake.userData.fakeMirror = true; fake.castShadow = false; g.add(fake);
  return g;
}
function buildTV(it) {
  const g = new THREE.Group(), { w, d, h } = it;
  g.add(bx(w, h, d, M('#0c0d0f', 0.35, 0.3), 0, h / 2, 0));
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.03, h - 0.03), M('#000000', 0.3, 0, { emissive: '#ffffff', emissiveMap: tvTex(), emissiveIntensity: 1.1 }));
  scr.position.set(0, h / 2, d / 2 + 0.001); g.add(scr);
  return g;
}
function buildFan(it) {
  const g = new THREE.Group(), { w, h } = it, dk = DARK(), r = w * 0.44;
  g.add(cy(w * 0.42, 0.04, dk, 'y', 0, 0.02, 0, 24));
  g.add(cy(0.018, h - 0.25, CHROME(), 'y', 0, (h - 0.25) / 2, 0, 10));
  const head = new THREE.Group(); head.position.set(0, h - r, 0); g.add(head);
  head.add(cy(0.07, 0.16, dk, 'z', 0, 0, -0.1, 16));
  for (const z of [-0.035, 0.04]) head.add(mesh(new THREE.TorusGeometry(r, 0.008, 6, 36), M(it.color, 0.4, 0.3), 0, 0, z));
  const grill = mesh(new THREE.CircleGeometry(r, 24, 0, Math.PI * 2), M(it.color, 0.5, 0.2, { wireframe: true }), 0, 0, 0.04); grill.castShadow = false; head.add(grill);
  const rotor = new THREE.Group(); head.add(rotor);
  for (let i = 0; i < 3; i++) { const piv = new THREE.Group(); piv.rotation.z = (i / 3) * Math.PI * 2; const b = bx(0.09, r * 0.8, 0.01, M('#c9ccd1', 0.5, 0.2), 0, r * 0.45, 0); b.rotation.y = 0.35; piv.add(b); rotor.add(piv); }
  g.userData.ticks = [(t) => { rotor.rotation.z = -t * 14; }];
  return g;
}
function buildPlant(it) {
  const g = new THREE.Group(), { w, h } = it, r = rng(hashStr(it.id || 'plant'));
  g.add(cy(w * 0.36, 0.38, M(it.color, 0.9), 'y', 0, 0.19, 0, 24, w * 0.44));
  g.add(cy(w * 0.41, 0.02, M('#3b2b1e', 1), 'y', 0, 0.37, 0, 20));
  const leaf = M('#3f7d3a', 0.7), leaf2 = M('#2f6a2c', 0.7);
  for (let i = 0; i < 11; i++) {
    const a = r() * Math.PI * 2, tilt = 0.25 + r() * 0.75, len = 0.35 + r() * (h - 0.5) * 0.65;
    const hr = Math.min(Math.sin(tilt) * len, w * 0.8);
    const tip = [Math.cos(a) * hr, 0.38 + Math.cos(tilt) * len, Math.sin(a) * hr];
    g.add(beam([0, 0.38, 0], tip, 0.006, leaf2, 5));
    const lf = mesh(new THREE.SphereGeometry(0.1, 10, 6), i % 2 ? leaf : leaf2, ...tip);
    lf.scale.set(1, 0.16, 1.9); lf.rotation.y = -a + Math.PI / 2; lf.rotation.x = 0.3; g.add(lf);
  }
  return g;
}
function buildPlyo(it) {
  const g = new THREE.Group(), { w, d, h } = it;
  g.add(rb(w, h, d, 0.012, M(it.color, 0.72), 0, h / 2, 0));
  for (const s of [-1, 1]) g.add(bx(0.006, 0.05, 0.18, M('#2a1c10', 0.9), s * (w / 2 + 0.002), h * 0.72, 0));
  return g;
}
function buildTurf(it) {
  const g = new THREE.Group(), { w, d, h } = it;
  const t = turfTex().clone(); t.needsUpdate = true; t.repeat.set(1, d);
  const m = new THREE.MeshStandardMaterial({ map: t, roughness: 1 }); m.userData.own = true;
  g.add(bx(w, h, d, m, 0, h / 2, 0));
  const sled = new THREE.Group(); sled.position.set(0, h, d / 2 - 0.55); g.add(sled);
  const fr = M('#1c1d20', 0.45, 0.35);
  for (const s of [-1, 1]) { sled.add(bx(0.06, 0.03, 0.75, fr, s * 0.22, 0.015, 0)); sled.add(beam([s * 0.22, 0.03, 0.2], [s * 0.2, 1.0, 0.38], 0.016, fr)); }
  sled.add(bx(0.5, 0.02, 0.5, fr, 0, 0.04, -0.05));
  sled.add(cy(0.025, 0.35, CHROME(), 'y', 0, 0.22, -0.05, 12));
  for (let i = 0; i < 2; i++) { const p = plate(i ? 20 : 25, 'y'); p.position.set(0, 0.09 + i * 0.065, -0.05); sled.add(p); }
  return g;
}
function buildMat(it) {
  const g = new THREE.Group(), { w, d, h } = it;
  g.add(rb(w, h, d, 0.004, M(it.color, 0.85), 0, h / 2, 0));
  return g;
}
function buildShelf(it) {
  const g = new THREE.Group(), { w, d, h } = it, fr = M(it.color, 0.45, 0.4), r = rng(hashStr(it.id || 'shelf'));
  for (const x of [-w / 2 + 0.02, w / 2 - 0.02]) for (const z of [-d / 2 + 0.02, d / 2 - 0.02]) g.add(bx(0.035, h, 0.035, fr, x, h / 2, z));
  const ys = [0.1, h * 0.36, h * 0.66, h - 0.03];
  const bins = ['#d7262e', '#1f5fd1', '#f2b705', '#1f9d55', '#2a2b2e', '#e9e9e6'];
  ys.forEach((y, i) => {
    g.add(bx(w, 0.025, d, M('#3a3d42', 0.7, 0.2), 0, y, 0));
    if (i === ys.length - 1) return;
    let x = -w / 2 + 0.06;
    while (x < w / 2 - 0.2) {
      const bw = 0.18 + r() * 0.16, bh = Math.min(0.24, (ys[i + 1] - y) - 0.06) * (0.6 + r() * 0.4);
      if (r() < 0.3) { g.add(cy(0.06, d * 0.7, M('#cfd3d6', 0.95), 'z', x + 0.07, y + 0.073, 0, 14)); x += 0.16; continue; }
      g.add(bx(bw, bh, d * 0.8, M(bins[Math.floor(r() * bins.length)], 0.7), x + bw / 2, y + 0.0125 + bh / 2, 0));
      x += bw + 0.04;
    }
  });
  return g;
}
function buildFridge(it) {
  const g = new THREE.Group(), { w, d, h } = it;
  g.add(bx(w, h, d, M(it.color, 0.35, 0.1), 0, h / 2, 0));
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.08, h - 0.14), M('#0a1420', 0.2, 0, { emissive: '#bfe3ff', emissiveIntensity: 0.35 }));
  glow.position.set(0, h / 2 + 0.02, d / 2 + 0.002); g.add(glow);
  const cans = ['#d7262e', '#1f5fd1', '#f2b705', '#1f9d55', '#e9e9e6'];
  for (let row = 0; row < 3; row++) for (let i = 0; i < 4; i++) g.add(cy(0.03, 0.11, M(cans[(i + row) % cans.length], 0.4, 0.5), 'y', -w / 2 + 0.1 + i * (w - 0.2) / 3, 0.18 + row * (h - 0.3) / 3, d / 2 - 0.02, 12));
  g.add(bx(0.02, h * 0.35, 0.03, CHROME(), w / 2 - 0.05, h * 0.6, d / 2 + 0.02));
  return g;
}

// zone : espace d'usage devant (f), derrière (b) et sur les côtés (s), en mètres
const CATALOG = {
  r8drift: { name: 'Atletica R8 Drift', cat: 'force', w: 2.61, d: 1.23, h: 2.26, price: 1679, priceOf: (it) => (it.variant === 'stack' ? 2069 : 1679), color: '#1b1c1f', zone: { f: 1.0, b: 0.3, s: 0.3 }, pullup: true, flip: true, variants: true, build: buildR8Drift },
  bradley: { name: 'Atletica R8 Bradley Moyen', cat: 'force', w: 1.23, d: 1.23, h: 2.31, price: 1899, color: '#1b1c1f', zone: { f: 1.2, b: 0.3, s: 0.45 }, pullup: true, build: buildBradley },
  duality: { name: 'Atletica R8 Duality', cat: 'force', w: 1.63, d: 2.35, h: 2.26, price: 1629, color: '#1b1c1f', zone: { f: 0.5, b: 0.3, s: 0.3 }, pullup: true, build: buildDuality },
  predator: { name: 'Banc Predator', cat: 'force', w: 0.655, d: 1.5, h: 0.46, price: 379, priceOf: (it) => 379 + (it.evo ? 199 : 0), color: '#1a1b1d', zone: { f: 0.3, b: 0.3, s: 0.5 }, zoneOk: true, evo: true, build: buildPredator },
  rack: { name: 'Power rack', cat: 'force', w: 1.22, d: 1.4, h: 2.3, price: 690, color: '#1c1d20', zone: { f: 1.0, b: 0.2, s: 0.5 }, pullup: true, build: buildRack },
  wallrack: { name: 'Rack mural repliable', cat: 'force', w: 1.2, d: 0.56, h: 2.2, price: 520, color: '#1c1d20', zone: { f: 1.4, b: 0, s: 0.55 }, wall: true, pullup: true, build: buildWallRack },
  bench: { name: 'Banc réglable', cat: 'force', w: 0.6, d: 1.35, h: 0.45, price: 260, color: '#1e2024', zone: { f: 0.3, b: 0.3, s: 0.5 }, zoneOk: true, build: buildBench },
  cable: { name: 'Poulie vis-à-vis', cat: 'force', w: 3.4, d: 0.9, h: 2.25, price: 1890, color: '#2a2c30', zone: { f: 1.6, b: 0, s: 0.2 }, build: buildCable },
  legpress: { name: 'Presse à cuisses 45°', cat: 'force', w: 1.5, d: 2.1, h: 1.45, price: 1290, color: '#1c1d20', zone: { f: 0.3, b: 0.5, s: 0.6 }, build: buildLegpress },
  platform: { name: "Plateforme d'haltérophilie", cat: 'libre', w: 2.44, d: 2.44, h: 0.05, price: 380, color: '#c8975a', flat: true, build: buildPlatform },
  delta: { name: 'Barre olympique Delta', cat: 'libre', w: 2.2, d: 0.06, h: 0.05, price: 249, color: '#d7dbe0', noCollide: true, lift: true, build: buildOlyBar },
  ezbar: { name: 'Barre EZ', cat: 'libre', w: 1.2, d: 0.08, h: 0.05, price: 89, color: '#d7dbe0', noCollide: true, lift: true, build: buildEZ },
  bumpers110: { name: 'Disques bumper noirs 110 kg', cat: 'libre', w: 0.62, d: 0.5, h: 0.47, price: 392, color: '#1a1b1d', zone: { f: 0.4, b: 0, s: 0.2 }, build: buildBumperSet },
  l1pair: { name: 'Haltères L1 Olympia (2 sets)', cat: 'libre', w: 0.52, d: 0.55, h: 0.23, price: 500, color: '#2b2d31', noCollide: true, build: buildL1Pair },
  dumbbells: { name: "Rack d'haltères", cat: 'libre', w: 1.3, d: 0.55, h: 0.82, price: 1450, color: '#1c1d20', zone: { f: 1.0, b: 0, s: 0.2 }, build: buildDumbbells },
  kettlebells: { name: 'Étagère kettlebells', cat: 'libre', w: 1.0, d: 0.36, h: 0.62, price: 520, color: '#1c1d20', zone: { f: 0.8, b: 0, s: 0.1 }, build: buildKettlebells },
  platetree: { name: 'Arbre à disques', cat: 'libre', w: 0.6, d: 0.6, h: 1.2, price: 450, color: '#1c1d20', zone: { f: 0.4, b: 0.4, s: 0.3 }, build: buildPlateTree },
  treadmill: { name: 'Tapis de course', cat: 'cardio', w: 0.85, d: 1.85, h: 1.45, price: 1290, color: '#26282c', zone: { f: 0.2, b: 2.0, s: 0.5 }, build: buildTreadmill },
  rower: { name: 'Rameur', cat: 'cardio', w: 0.6, d: 2.44, h: 1.0, price: 1090, color: '#1b1c1f', zone: { f: 0.3, b: 0.6, s: 0.6 }, build: buildRower },
  bike: { name: 'Air bike', cat: 'cardio', w: 0.65, d: 1.3, h: 1.3, price: 990, color: '#1c1d20', zone: { f: 0.3, b: 0.6, s: 0.5 }, build: buildBike },
  bag: { name: 'Sac de frappe', cat: 'sol', w: 0.36, d: 0.36, h: 1.2, price: 180, color: '#a3161f', zone: { f: 0.75, b: 0.75, s: 0.75 }, hang: true, build: buildBag },
  turf: { name: 'Piste gazon + traîneau', cat: 'sol', w: 1.0, d: 5.0, h: 0.015, price: 620, color: '#3c7b33', flat: true, build: buildTurf },
  plyo: { name: 'Box de saut', cat: 'sol', w: 0.76, d: 0.61, h: 0.51, price: 140, color: '#c99a63', zone: { f: 0.6, b: 0.6, s: 0.4 }, build: buildPlyo },
  mat: { name: 'Tapis de sol', cat: 'sol', w: 0.61, d: 1.83, h: 0.01, price: 35, color: '#5b7a6a', flat: true, build: buildMat },
  mirror: { name: 'Miroir mural', cat: 'deco', w: 2.0, d: 0.03, h: 1.8, elev: 0.3, price: 240, color: '#141517', wall: true, build: buildMirror },
  tv: { name: 'Écran mural', cat: 'deco', w: 1.25, d: 0.06, h: 0.72, elev: 1.35, price: 450, color: '#0c0d0f', wall: true, build: buildTV },
  shelf: { name: 'Étagère de rangement', cat: 'deco', w: 1.2, d: 0.45, h: 1.8, price: 110, color: '#2c2f34', zone: { f: 0.5, b: 0, s: 0 }, build: buildShelf },
  fridge: { name: 'Frigo à boissons', cat: 'deco', w: 0.5, d: 0.55, h: 0.85, price: 220, color: '#f2f2f0', zone: { f: 0.5, b: 0, s: 0 }, build: buildFridge },
  fan: { name: 'Ventilateur', cat: 'deco', w: 0.5, d: 0.45, h: 1.25, price: 90, color: '#c9ccd1', build: buildFan },
  plant: { name: 'Plante verte', cat: 'deco', w: 0.45, d: 0.45, h: 1.3, price: 60, color: '#9c9a94', build: buildPlant },
};

const OPEN_DEF = {
  garage: { name: 'Porte de garage', w: 2.4, h: 2.0, color: '#3b4047' },
  door: { name: 'Porte', w: 0.9, h: 2.1, color: '#f2f1ee' },
  window: { name: 'Fenêtre', w: 1.2, h: 1.0, sill: 1.1, color: '#2f3338' },
};

/* ---------------------------------------------------------------------------
   Modèles de départ
--------------------------------------------------------------------------- */
function mkItem(type, x, z, rot = 0, extra = {}) {
  const d = CATALOG[type];
  return { id: uid(), type, x, z, rot, w: d.w, d: d.d, h: d.h, elev: d.elev || 0, color: d.color, ...extra };
}
function mkOpen(type, wall, pos, extra = {}) {
  const d = OPEN_DEF[type];
  return { id: uid(), type, wall, pos, w: d.w, h: d.h, sill: d.sill || 0, color: d.color, open: 0, ...extra };
}
const baseOpts = () => ({ cotes: true, zones: true, grid: false, snap: true, labels: true });
const PRESETS = {
  double: () => ({
    name: 'Mon garage gym', room: { w: 5.8, d: 5.6, h: 2.6 },
    walls: { N: { mat: 'concrete', color: '#ffffff' }, E: { mat: 'paint', color: '#e4e1db' }, S: { mat: 'paint', color: '#e4e1db' }, W: { mat: 'paintbrick', color: '#f1efea' } },
    floor: { mat: 'rubber', color: '#2e2f33' }, light: 'day', wallMode: 'auto', opts: baseOpts(),
    openings: [mkOpen('garage', 'S', 0.65, { w: 4.5, h: 2.1 }), mkOpen('door', 'E', 4.45), mkOpen('window', 'W', 1.0, { w: 1.2, h: 0.9, sill: 1.3 })],
    items: [
      mkItem('platform', -1.67, -1.55),
      mkItem('r8drift', -1.0, -2.12),
      mkItem('mirror', 1.65, -2.785, 0),
      mkItem('bench', 1.33, -1.45, 90, { color: '#a3161f' }),
      mkItem('dumbbells', 2.625, -0.25, 90),
      mkItem('tv', 2.87, -0.25, 90),
      mkItem('kettlebells', 2.72, 1.15, 90),
      mkItem('rower', -2.45, 1.2, 0),
      mkItem('bike', 1.35, 1.5, 180),
      mkItem('fan', 0.05, 1.9, 200),
      mkItem('plant', 2.6, -2.5),
      mkItem('bag', 0.05, 0.0),
    ],
  }),
  simple: () => ({
    name: 'Garage simple', room: { w: 3.0, d: 6.0, h: 2.4 },
    walls: { N: { mat: 'osb', color: '#ffffff' }, E: { mat: 'osb', color: '#ffffff' }, S: { mat: 'paint', color: '#e4e1db' }, W: { mat: 'osb', color: '#ffffff' } },
    floor: { mat: 'rubber', color: '#2e2f33' }, light: 'neon', wallMode: 'auto', opts: baseOpts(),
    openings: [mkOpen('garage', 'S', 0.3, { w: 2.4, h: 2.0 })],
    items: [
      mkItem('wallrack', 0, -2.72, 0, { h: 2.05 }),
      mkItem('bench', 0, -1.15, 0, { color: '#1f5fd1' }),
      mkItem('platetree', -1.17, -0.5),
      mkItem('rower', 1.15, 0.9, 0),
      mkItem('kettlebells', -1.3, 0.75, 270),
      mkItem('mat', -0.55, 1.6, 0),
    ],
  }),
  chambre: () => ({
    name: "Salle dans la chambre d'amis", room: { w: 3.5, d: 3.0, h: 2.5 },
    walls: { N: { mat: 'wood', color: '#ffffff' }, E: { mat: 'paint', color: '#d9e2dc' }, S: { mat: 'paint', color: '#d9e2dc' }, W: { mat: 'paint', color: '#d9e2dc' } },
    floor: { mat: 'parquet', color: '#ffffff' }, light: 'day', wallMode: 'auto', opts: baseOpts(),
    openings: [mkOpen('door', 'S', 0.25), mkOpen('window', 'N', 1.15, { w: 1.2, h: 1.25, sill: 0.95 })],
    items: [
      mkItem('treadmill', -1.25, -0.4, 180),
      mkItem('mirror', 1.73, -0.1, 90, { w: 1.6 }),
      mkItem('mat', 0.6, 0.15, 0),
      mkItem('kettlebells', 0.95, -1.3, 0),
      mkItem('plant', 1.45, 1.2),
      mkItem('tv', -1.72, 0.0, 270, { elev: 1.4 }),
    ],
  }),
  soussol: () => ({
    name: 'Sous-sol', room: { w: 4.5, d: 4.0, h: 2.15 },
    walls: { N: { mat: 'concrete', color: '#ffffff' }, E: { mat: 'concrete', color: '#ffffff' }, S: { mat: 'foam', color: '#4a4d54' }, W: { mat: 'concrete', color: '#ffffff' } },
    floor: { mat: 'epoxy', color: '#a3a8ae' }, light: 'rgb', wallMode: 'auto', opts: baseOpts(),
    openings: [mkOpen('door', 'N', 3.3)],
    items: [
      mkItem('platform', 0.4, -0.75),
      mkItem('rack', 0.4, -0.95, 0, { h: 2.0 }),
      mkItem('bench', -1.5, 0.6, 0),
      mkItem('dumbbells', 1.95, 0.9, 90),
      mkItem('bag', -1.3, -1.2),
    ],
  }),
};

/* ---------------------------------------------------------------------------
   État, historique, sauvegarde
--------------------------------------------------------------------------- */
let doc = null;
const ui = { view: 'iso', sel: null, isoAz: Math.PI / 4 };
const hist = { stack: [], idx: -1 };

function normalizeDoc(d) {
  const p = PRESETS.double();
  const out = {
    name: typeof d?.name === 'string' ? d.name.slice(0, 60) : p.name,
    room: { w: clamp(num(d?.room?.w, 5.8), 2, 14), d: clamp(num(d?.room?.d, 5.6), 2, 14), h: clamp(num(d?.room?.h, 2.6), 2, 4.5) },
    walls: {}, floor: { mat: FLOOR_SURF[d?.floor?.mat] ? d.floor.mat : 'rubber', color: /^#[0-9a-f]{6}$/i.test(d?.floor?.color) ? d.floor.color : FLOOR_SURF.rubber.color },
    light: ['day', 'neon', 'rgb'].includes(d?.light) ? d.light : 'day',
    wallMode: ['auto', 'low', 'full'].includes(d?.wallMode) ? d.wallMode : 'auto',
    opts: { ...baseOpts(), ...(d?.opts || {}) },
    openings: [], items: [],
    migr: Array.isArray(d?.migr) ? d.migr : ['r8drift'],
  };
  for (const s of SIDES) {
    const wl = d?.walls?.[s];
    const mat = WALL_SURF[wl?.mat] ? wl.mat : 'paint';
    out.walls[s] = { mat, color: /^#[0-9a-f]{6}$/i.test(wl?.color) ? wl.color : WALL_SURF[mat].color };
  }
  for (const o of Array.isArray(d?.openings) ? d.openings : []) {
    if (!OPEN_DEF[o?.type] || !SIDES.includes(o.wall)) continue;
    const def = OPEN_DEF[o.type];
    out.openings.push({ id: String(o.id || uid()), type: o.type, wall: o.wall, pos: num(o.pos, 0.5), w: clamp(num(o.w, def.w), 0.4, 8), h: clamp(num(o.h, def.h), 0.3, 4.4), sill: clamp(num(o.sill, def.sill || 0), 0, 3), color: /^#[0-9a-f]{6}$/i.test(o.color) ? o.color : def.color, open: o.open ? 1 : 0 });
  }
  for (const it of Array.isArray(d?.items) ? d.items : []) {
    const def = CATALOG[it?.type]; if (!def) continue;
    out.items.push({ id: String(it.id || uid()), type: it.type, x: num(it.x, 0), z: num(it.z, 0), rot: num(it.rot, 0), w: clamp(num(it.w, def.w), 0.01, 8), d: clamp(num(it.d, def.d), 0.01, 8), h: clamp(num(it.h, def.h), 0.005, 4.4), elev: clamp(num(it.elev, def.elev || 0), 0, 4), color: /^#[0-9a-f]{6}$/i.test(it.color) ? it.color : def.color, ...(it.flip ? { flip: true } : {}), ...(it.variant === 'stack' ? { variant: 'stack' } : {}), ...(it.evo ? { evo: true } : {}) });
  }
  return out;
}
function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(doc)); } catch { /* stockage indisponible */ } }
function loadSaved() {
  try {
    const s = localStorage.getItem(STORE_KEY); if (!s) return null;
    const raw = JSON.parse(s);
    const d = normalizeDoc(raw);
    if (!Array.isArray(raw.migr)) d.migr = [];
    return d;
  } catch { return null; }
}
// Remplace le power rack d'un projet existant par l'Atletica R8 Drift : la cage reprend la place de l'ancien rack,
// et la tour à poulie part du côté où elle gêne le moins.
function migrateRackToR8() {
  const racks = doc.items.filter((i) => i.type === 'rack');
  for (const old of racks) {
    const idx = doc.items.indexOf(old);
    let best = null;
    for (const flip of [false, true]) {
      const n = mkItem('r8drift', 0, 0, old.rot, flip ? { flip: true } : {});
      const cw = Math.min(1.23, (n.w - Math.min(0.3, n.w * 0.12)) * 0.55);
      const lx = (flip ? 1 : -1) * (n.w / 2 - cw / 2);   // centre de la cage dans le repère du R8
      const lz = n.d / 2 - old.d / 2;                       // dos de la cage aligné sur celui de l'ancien rack
      const th = -old.rot * DEG, c = Math.cos(th), sn = Math.sin(th);
      n.x = old.x - lx * c + lz * sn; n.z = old.z + lx * sn + lz * c;
      clampItem(n);
      doc.items[idx] = n;
      const res = analyze();
      doc.items[idx] = old;
      const score = (res.bad.has(n.id) ? 100 : 0) + (res.items[n.id] || []).length * 10 + res.bad.size + Math.hypot(n.x - old.x, n.z - old.z);
      if (!best || score < best.score) best = { n, score };
    }
    doc.items[idx] = best.n;
  }
  return racks.length;
}
function commit() {
  const s = JSON.stringify(doc);
  if (hist.stack[hist.idx] === s) return;
  hist.stack = hist.stack.slice(0, hist.idx + 1);
  hist.stack.push(s);
  if (hist.stack.length > 120) hist.stack.shift();
  hist.idx = hist.stack.length - 1;
  save(); syncUndo();
}
function restore(s) {
  doc = JSON.parse(s);
  if (ui.sel && !findSel()) ui.sel = null;
  rebuildAll(); save(); syncUndo();
}
function undo() { if (hist.idx > 0) { hist.idx--; restore(hist.stack[hist.idx]); toast('Annulé'); } }
function redo() { if (hist.idx < hist.stack.length - 1) { hist.idx++; restore(hist.stack[hist.idx]); toast('Rétabli'); } }
function syncUndo() { $('#btnUndo').disabled = hist.idx <= 0; $('#btnRedo').disabled = hist.idx >= hist.stack.length - 1; }
function loadDoc(d, msg) { doc = normalizeDoc(d); ui.sel = null; rebuildAll(); fitView(); commit(); if (msg) toast(msg); }

/* ---------------------------------------------------------------------------
   Rendu : moteur, caméras, lumières
--------------------------------------------------------------------------- */
const stageEl = $('#stage');
let renderer, labelRenderer, scene, persp, ortho, ctlO, ctlP, camera, pmrem;
let hemi, key, points = [];
const roomG = new THREE.Group(), openG = new THREE.Group(), itemsG = new THREE.Group(), overG = new THREE.Group(), coteG = new THREE.Group(), outsideG = new THREE.Group(), fixturesG = new THREE.Group();
let floorMesh, ceilingMesh, gridLines;
const wallGroups = {};
const cutState = { N: false, E: false, S: false, W: false };
const coteMats = [];
const ROOM_CLIP = [new THREE.Plane(), new THREE.Plane(), new THREE.Plane(), new THREE.Plane()];

function initRenderer() {
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.localClippingEnabled = true;
  stageEl.prepend(renderer.domElement);
  renderer.domElement.setAttribute('aria-label', 'Vue 3D de la salle');

  labelRenderer = new CSS2DRenderer();
  labelRenderer.domElement.className = 'labels';
  stageEl.insertBefore(labelRenderer.domElement, renderer.domElement.nextSibling);

  scene = new THREE.Scene();
  pmrem = new THREE.PMREMGenerator(renderer);
  envTex = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

  persp = new THREE.PerspectiveCamera(50, 1, 0.03, 200);
  ortho = new THREE.OrthographicCamera(-5, 5, 5, -5, 0.1, 300);
  camera = ortho;

  scene.add(roomG, openG, itemsG, overG, coteG, outsideG, fixturesG);

  hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
  key = new THREE.DirectionalLight(0xffffff, 2);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.bias = -0.0003;
  key.shadow.normalBias = 0.02;
  key.shadow.radius = 3;
  scene.add(hemi, key, key.target);
  for (let i = 0; i < 4; i++) { const p = new THREE.PointLight(0xffffff, 0, 0, 2); points.push(p); scene.add(p); }

  const under = new LineMaterial({ color: 0x0d0f12, linewidth: 4.5, transparent: true, opacity: 0.55, depthTest: false });
  const over = new LineMaterial({ color: 0xffd23f, linewidth: 1.6, depthTest: false, transparent: true });
  coteMats.push(under, over);
}

function makeControls() {
  ctlO = new OrbitControls(ortho, renderer.domElement);
  ctlP = new OrbitControls(persp, renderer.domElement);
  ctlO.zoomSpeed = 1.2; ctlO.minZoom = 0.35; ctlO.maxZoom = 6;
  ctlP.enableDamping = true; ctlP.dampingFactor = 0.08;
  ctlP.minDistance = 0.6; ctlP.maxDistance = 40; ctlP.maxPolarAngle = Math.PI / 2 - 0.03;
  ctlO.addEventListener('change', () => { if (ui.view === 'iso') ui.isoAz = ctlO.getAzimuthalAngle(); });
}
const activeCtl = () => (ui.view === 'plan' || ui.view === 'iso' ? ctlO : ui.view === 'orbit' ? ctlP : null);

const LIGHTS = {
  day: { ceil: 0.55, sky: '#bdd2e5', hemi: [0xeef3fa, 0x6f675b, 1.15], key: [0xfff3e2, 2.3], exp: 1.0, fix: '#ffffff', fixI: 1.4, pts: [] },
  neon: { ceil: 0.32, sky: '#1c2330', hemi: [0xd9e6ff, 0x2c3038, 0.55], key: [0xe8f1ff, 1.6], exp: 1.05, fix: '#eef6ff', fixI: 3.2, pts: [[0xdfeaff, 7], [0xdfeaff, 7], [0xdfeaff, 7], [0xdfeaff, 7]] },
  rgb: { ceil: 0.05, sky: '#0c0a15', hemi: [0x5a3f9a, 0x0f0a1a, 0.28], key: [0x9a8cff, 0.5], exp: 1.15, fix: '#ff2bd6', fixI: 3.5, pts: [[0xff2bd6, 9], [0x22d3ee, 9], [0xff2bd6, 9], [0x22d3ee, 9]] },
};
function applyLight() {
  const L = LIGHTS[doc.light];
  hemi.color.set(L.hemi[0]); hemi.groundColor.set(L.hemi[1]); hemi.intensity = L.hemi[2];
  key.color.set(L.key[0]); key.intensity = L.key[1];
  renderer.toneMappingExposure = L.exp;
  const { w, d, h } = doc.room;
  const spots = [[0, h - 0.35, -d / 4], [w / 4, h - 0.35, 0], [0, h - 0.35, d / 4], [-w / 4, h - 0.35, 0]];
  points.forEach((p, i) => {
    const pt = L.pts[i];
    p.intensity = pt ? pt[1] * Math.max(1, (w * d) / 18) : 0;
    if (pt) p.color.set(pt[0]);
    p.position.set(...spots[i]);
  });
  const s = Math.max(w, d) / 2 + 2.5;
  Object.assign(key.shadow.camera, { left: -s, right: s, top: s, bottom: -s, near: 1, far: 40 });
  key.shadow.camera.updateProjectionMatrix();
  key.position.set(1.6, 14, 2.6); key.target.position.set(0, 0, 0);
  updateBackground();
}
function updateBackground() {
  if (!scene) return;
  const ortho = ui.view === 'plan' || ui.view === 'iso';
  scene.background = new THREE.Color(ortho ? (cssVar('--stage') || '#d9dee4') : LIGHTS[doc.light].sky);
}

/* ---------------------------------------------------------------------------
   Pièce : sol, murs (découpés autour des ouvertures), plafond, extérieur
--------------------------------------------------------------------------- */
function wallInfo(side) {
  const { w, d } = doc.room;
  switch (side) {
    case 'N': return { L: w, o: new V3(-w / 2, 0, -d / 2), u: new V3(1, 0, 0), n: new V3(0, 0, 1) };
    case 'S': return { L: w, o: new V3(-w / 2, 0, d / 2), u: new V3(1, 0, 0), n: new V3(0, 0, -1) };
    case 'W': return { L: d, o: new V3(-w / 2, 0, -d / 2), u: new V3(0, 0, 1), n: new V3(1, 0, 0) };
    default: return { L: d, o: new V3(w / 2, 0, -d / 2), u: new V3(0, 0, 1), n: new V3(-1, 0, 0) };
  }
}
function worldUV(geo) {
  const p = geo.attributes.position, n = geo.attributes.normal, uv = geo.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const nx = n.getX(i), ny = n.getY(i), nz = n.getZ(i), ax = Math.abs(nx), ay = Math.abs(ny), az = Math.abs(nz);
    if (ay >= ax && ay >= az) uv.setXY(i, p.getX(i), -p.getZ(i));
    else if (ax >= az) uv.setXY(i, p.getZ(i) * (nx > 0 ? -1 : 1), p.getY(i));
    else uv.setXY(i, p.getX(i) * (nz > 0 ? 1 : -1), p.getY(i));
  }
  uv.needsUpdate = true;
}
const surfMatCache = new Map();
function surfMat(kind, key, color) {
  const defs = kind === 'floor' ? FLOOR_SURF : WALL_SURF;
  const def = defs[key];
  const ck = `${kind}|${key}|${color}`;
  let m = surfMatCache.get(ck);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ map: surfTex(kind, key).tex, color: new THREE.Color(color), roughness: def.rough ?? 0.9, metalness: def.metal || 0 });
    if (def.metal) m.envMap = envTex;
    surfMatCache.set(ck, m);
  }
  return m;
}
function disposeTree(o) {
  o.traverse((c) => {
    if (c.geometry) c.geometry.dispose();
    if (c.material && c.material.userData?.own) { c.material.map?.dispose(); c.material.dispose(); }
    if (c.userData.reflector) c.dispose();
  });
}
function clearGroup(g) { for (const c of [...g.children]) { disposeTree(c); g.remove(c); } }

function buildRoom() {
  clearGroup(roomG); clearGroup(outsideG); clearGroup(fixturesG);
  const { w, d, h } = doc.room;
  ROOM_CLIP[0].set(new V3(1, 0, 0), w / 2); ROOM_CLIP[1].set(new V3(-1, 0, 0), w / 2); ROOM_CLIP[2].set(new V3(0, 0, 1), d / 2); ROOM_CLIP[3].set(new V3(0, 0, -1), d / 2);
  const fgeo = new THREE.PlaneGeometry(w, d); fgeo.rotateX(-Math.PI / 2); worldUV(fgeo);
  floorMesh = new THREE.Mesh(fgeo, surfMat('floor', doc.floor.mat, doc.floor.color));
  floorMesh.receiveShadow = true; floorMesh.userData.floor = true;
  roomG.add(floorMesh);
  for (const s of SIDES) buildWall(s);

  const cgeo = new THREE.PlaneGeometry(w + 0.02, d + 0.02); cgeo.rotateX(Math.PI / 2);
  ceilingMesh = new THREE.Mesh(cgeo, M('#eeeeeb', 0.95, 0, { emissive: '#ffffff', emissiveIntensity: LIGHTS[doc.light].ceil })); ceilingMesh.position.y = h; ceilingMesh.receiveShadow = true;
  roomG.add(ceilingMesh);

  // luminaires au plafond (visibles en visite)
  const nx = Math.max(1, Math.round(w / 2.2)), nz = Math.max(1, Math.round(d / 2.2));
  const L = LIGHTS[doc.light];
  const fixMat = M('#ffffff', 0.4, 0, { emissive: L.fix, emissiveIntensity: L.fixI });
  for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
    const x = -w / 2 + (i + 0.5) * w / nx, z = -d / 2 + (j + 0.5) * d / nz;
    if (doc.light === 'neon') { fixturesG.add(bx(1.2, 0.05, 0.1, fixMat, x, h - 0.03, z)); }
    else if (doc.light === 'day') { fixturesG.add(bx(0.6, 0.02, 0.6, fixMat, x, h - 0.012, z)); }
    else { const r = mesh(new THREE.TorusGeometry(0.22, 0.012, 6, 32), fixMat, x, h - 0.03, z); r.rotation.x = Math.PI / 2; fixturesG.add(r); }
  }
  fixturesG.traverse((o) => { o.castShadow = false; });

  // extérieur : pelouse et allées devant les portes de garage
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(90, 90), M('#7b8a66', 1));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.012; ground.receiveShadow = true; outsideG.add(ground);
  const drive = M('#9d9a94', 0.95);
  for (const op of doc.openings) {
    if (op.type !== 'garage' && op.type !== 'door') continue;
    const info = wallInfo(op.wall), len = op.type === 'garage' ? 7 : 2.5, wid = op.w + (op.type === 'garage' ? 1.2 : 0.4);
    const c = info.o.clone().addScaledVector(info.u, op.pos + op.w / 2).addScaledVector(info.n, -(WALL_T + len / 2));
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), drive);
    m.rotation.x = -Math.PI / 2; m.position.set(c.x, -0.006, c.z); m.receiveShadow = true;
    if (Math.abs(info.n.z) > 0.5) m.scale.set(wid, len, 1); else m.scale.set(len, wid, 1);
    outsideG.add(m);
  }
  buildGrid();
  applyLight();
  updateVisibility();
}

function buildWall(side) {
  if (wallGroups[side]) { disposeTree(wallGroups[side]); roomG.remove(wallGroups[side]); }
  const g = new THREE.Group(); g.userData.side = side; wallGroups[side] = g; roomG.add(g);
  const info = wallInfo(side), { L, o, u, n } = info;
  const cut = cutState[side];
  const H = cut ? 0.32 : doc.room.h;
  const ext = side === 'N' || side === 'S' ? WALL_T : 0;
  const ops = doc.openings.filter((op) => op.wall === side && !(cut && op.type === 'window'))
    .map((op) => ({ a: op.pos, b: op.pos + op.w, y0: op.type === 'window' ? op.sill : 0, y1: (op.type === 'window' ? op.sill : 0) + op.h }))
    .sort((p, q) => p.a - q.a);
  const pieces = [];
  let cur = -ext;
  for (const op of ops) {
    const a = clamp(op.a, cur, L), b = clamp(op.b, a, L);
    if (a > cur + 1e-4) pieces.push([cur, a, 0, H]);
    if (b > a) {
      if (op.y0 > 0) pieces.push([a, b, 0, Math.min(op.y0, H)]);
      if (op.y1 < H) pieces.push([a, b, op.y1, H]);
    }
    cur = Math.max(cur, b);
  }
  if (cur < L + ext - 1e-4) pieces.push([cur, L + ext, 0, H]);

  const wl = doc.walls[side];
  const inner = surfMat('wall', wl.mat, wl.color), outer = surfMat('wall', 'paint', '#d3cdc2'), cap = M('#2a2d32', 0.9);
  const innerIdx = side === 'N' || side === 'W' ? 4 : 5;
  const mats = [inner, inner, cap, cap, outer, outer];
  mats[innerIdx] = inner; mats[innerIdx === 4 ? 5 : 4] = outer;
  for (const [u0, u1, y0, y1] of pieces) {
    if (y1 - y0 < 0.005 || u1 - u0 < 0.005) continue;
    const geo = new THREE.BoxGeometry(u1 - u0, y1 - y0, WALL_T);
    if (side === 'E' || side === 'W') geo.rotateY(Math.PI / 2);
    const c = o.clone().addScaledVector(u, (u0 + u1) / 2).addScaledVector(n, -WALL_T / 2);
    geo.translate(c.x, (y0 + y1) / 2, c.z);
    worldUV(geo);
    const m = new THREE.Mesh(geo, mats);
    m.receiveShadow = true; m.castShadow = false; m.userData.wall = side;
    g.add(m);
  }
  // bandeaux LED en ambiance soirée
  if (doc.light === 'rgb' && !cut) {
    const col = side === 'N' || side === 'S' ? '#ff2bd6' : '#22d3ee';
    const strip = M('#000000', 0.5, 0, { emissive: col, emissiveIntensity: 4 });
    const len = L - 0.1, c = o.clone().addScaledVector(u, L / 2).addScaledVector(n, 0.025);
    const geo = new THREE.BoxGeometry(len, 0.025, 0.02); if (side === 'E' || side === 'W') geo.rotateY(Math.PI / 2);
    const m = new THREE.Mesh(geo, strip); m.position.set(c.x, doc.room.h - 0.04, c.z); g.add(m);
  }
}

function buildGrid() {
  if (gridLines) { gridLines.geometry.dispose(); overG.remove(gridLines); }
  const { w, d } = doc.room, pts = [];
  for (let x = -w / 2 + 0.5; x < w / 2 - 0.01; x += 0.5) pts.push(x, 0.004, -d / 2, x, 0.004, d / 2);
  for (let z = -d / 2 + 0.5; z < d / 2 - 0.01; z += 0.5) pts.push(-w / 2, 0.004, z, w / 2, 0.004, z);
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  gridLines = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0x9aa6b2, transparent: true, opacity: 0.4, depthWrite: false }));
  overG.add(gridLines);
}

/* ---------------------------------------------------------------------------
   Ouvertures : porte de garage sectionnelle, porte battante, fenêtre
--------------------------------------------------------------------------- */
const openObjs = new Map();
function openingFrame(op) {
  const info = wallInfo(op.wall);
  const c = info.o.clone().addScaledVector(info.u, op.pos + op.w / 2);
  const x = new V3().crossVectors(UP, info.n);
  const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, UP, info.n));
  return { c, q, info };
}
function buildOpenings() {
  for (const [, o] of openObjs) { disposeTree(o.g); openG.remove(o.g); }
  openObjs.clear();
  for (const op of doc.openings) buildOpening(op);
}
function buildOpening(op) {
  const old = openObjs.get(op.id);
  const f = old ? old.f : op.open;
  if (old) { disposeTree(old.g); openG.remove(old.g); }
  const g = new THREE.Group(); g.userData.openId = op.id;
  const { c, q } = openingFrame(op);
  g.position.copy(c); g.quaternion.copy(q);
  const obj = { g, f, type: op.type };
  const W = op.w, H = op.h, trim = M('#e9e9e6', 0.6);
  if (op.type === 'garage') {
    const n = Math.max(4, Math.round(H / 0.52)), ph = H / n;
    const pm = M(op.color, 0.45, 0.25, { map: grooveTex() });
    obj.panels = [];
    for (let i = 0; i < n; i++) { const p = bx(W - 0.01, ph - 0.006, 0.04, pm); g.add(p); obj.panels.push(p); }
    obj.ph = ph; obj.H = H;
    const yT = Math.min(H + 0.25, doc.room.h - 0.06);
    obj.r = Math.max(0.05, yT - H); obj.yT = yT;
    obj.travel = (yT - obj.r) + Math.PI * obj.r / 2;
    const rail = M('#8d939a', 0.4, 0.6);
    for (const s of [-1, 1]) {
      g.add(bx(0.07, H + 0.07, 0.025, trim, s * (W / 2 + 0.035), (H + 0.07) / 2, 0.0125));
      g.add(bx(0.03, yT - obj.r, 0.05, rail, s * (W / 2 + 0.015), (yT - obj.r) / 2, 0.065));
      g.add(ceilPart(bx(0.03, 0.05, H + 0.35, rail, s * (W / 2 + 0.015), yT, 0.06 + obj.r + (H + 0.35) / 2 - 0.05)));
    }
    g.add(bx(W + 0.14, 0.07, 0.025, trim, 0, H + 0.035, 0.0125));
    const motorY = Math.min(yT + 0.08, doc.room.h - 0.09);
    g.add(ceilPart(bx(0.04, 0.03, H + 0.5, rail, 0, motorY, 0.25 + (H + 0.5) / 2 - 0.2)));
    g.add(ceilPart(bx(0.3, 0.14, 0.42, M('#e8e8e6', 0.5), 0, motorY, H + 0.55)));
    // zone du rail au plafond, affichée avec les zones d'usage
    const zl = H + 0.4;
    const zone = new THREE.Mesh(new THREE.PlaneGeometry(W, zl), new THREE.MeshBasicMaterial({ color: 0x8f98a3, transparent: true, opacity: 0.12, depthWrite: false }));
    zone.material.userData.own = true; zone.rotation.x = -Math.PI / 2; zone.position.set(0, 0.005, zl / 2); zone.userData.zoneOnly = true; g.add(zone);
  } else if (op.type === 'door') {
    for (const s of [-1, 1]) g.add(bx(0.07, H + 0.07, 0.025, trim, s * (W / 2 + 0.035), (H + 0.07) / 2, 0.0125));
    g.add(bx(W + 0.14, 0.07, 0.025, trim, 0, H + 0.035, 0.0125));
    const hinge = new THREE.Group(); hinge.position.set(-W / 2 + 0.02, 0, -0.03); g.add(hinge);
    const lw = W - 0.04;
    hinge.add(bx(lw, H - 0.012, 0.04, M(op.color, 0.5), lw / 2, (H - 0.012) / 2 + 0.006, 0));
    for (const s of [-1, 1]) hinge.add(cy(0.01, 0.12, CHROME(), 'x', lw - 0.1, 1.0, s * 0.035, 8));
    obj.hinge = hinge;
    // arc de débattement, comme sur un plan d'architecte
    const pts = [];
    for (let i = 0; i <= 24; i++) { const a = (i / 24) * Math.PI / 2; pts.push(new V3(-W / 2 + Math.cos(a) * lw, 0.006, Math.sin(a) * lw)); }
    pts.push(new V3(-W / 2, 0.006, 0));
    const arc = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineDashedMaterial({ color: 0x8f98a3, dashSize: 0.06, gapSize: 0.04 }));
    arc.computeLineDistances(); arc.material.userData.own = true; arc.userData.zoneOnly = true; g.add(arc);
  } else {
    const S = op.sill, fm = M(op.color, 0.45, 0.2), z = -WALL_T / 2;
    for (const s of [-1, 1]) g.add(bx(0.06, H, 0.08, fm, s * (W / 2 - 0.03), S + H / 2, z));
    for (const y of [S + 0.03, S + H - 0.03]) g.add(bx(W, 0.06, 0.08, fm, 0, y, z));
    g.add(bx(0.05, H - 0.1, 0.07, fm, 0, S + H / 2, z));
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.1, H - 0.1), new THREE.MeshStandardMaterial({ color: '#a9c9e3', transparent: true, opacity: 0.22, roughness: 0.05, metalness: 0.2, envMap: envTex, depthWrite: false, side: THREE.DoubleSide }));
    glass.material.userData.own = true; glass.position.set(0, S + H / 2, z); g.add(glass);
    if (S > 0.05) g.add(bx(W + 0.1, 0.03, 0.12, M('#f1f1ee', 0.5), 0, S - 0.015, 0.05));
  }
  g.traverse((m) => { if (m.isMesh || m.isLine) m.userData.openId = op.id; });
  openG.add(g);
  openObjs.set(op.id, obj);
  poseOpening(obj, obj.f);
  return obj;
}
function ceilPart(m) { m.userData.ceil = true; return m; }
function gPath(p, o) {
  const v = o.yT - o.r;
  if (p <= v) return [0.06, p];
  const arc = Math.PI * o.r / 2;
  if (p <= v + arc) { const a = (p - v) / o.r; return [0.06 + o.r - o.r * Math.cos(a), v + o.r * Math.sin(a)]; }
  return [0.06 + o.r + (p - v - arc), o.yT];
}
function poseOpening(obj, f) {
  obj.f = f;
  if (obj.type === 'garage') {
    const s = f * obj.travel;
    obj.panels.forEach((p, i) => {
      const [za, ya] = gPath(i * obj.ph + s, obj), [zb, yb] = gPath((i + 1) * obj.ph + s, obj);
      p.position.set(0, (ya + yb) / 2, (za + zb) / 2);
      p.rotation.x = Math.atan2(zb - za, yb - ya);
    });
  } else if (obj.type === 'door') {
    obj.hinge.rotation.y = -f * 1.65;
  }
}

/* ---------------------------------------------------------------------------
   Équipements : objets 3D, zones d'usage, sélection
--------------------------------------------------------------------------- */
const itemObjs = new Map();
function buildItems() {
  for (const [, o] of itemObjs) { disposeTree(o.g); disposeTree(o.over); itemsG.remove(o.g); overG.remove(o.over); }
  itemObjs.clear();
  for (const it of doc.items) addItemObj(it);
  refreshAnalysis();
}
function addItemObj(it) {
  const def = CATALOG[it.type];
  const g = def.build(it, { roomH: doc.room.h });
  g.userData.itemId = it.id;
  g.traverse((m) => { if (m.isMesh) m.userData.itemId = it.id; });
  itemsG.add(g);
  const over = new THREE.Group();
  const o = { g, over, zone: null, zoneLine: null, sel: null, tag: null };
  if (def.zone) {
    const z = def.zone, zw = it.w + 2 * z.s, zd = it.d + z.f + z.b, zc = (z.f - z.b) / 2;
    const col = new THREE.Color(CATS[def.cat].color);
    const zm = new THREE.Mesh(new THREE.PlaneGeometry(zw, zd), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.13, depthWrite: false, clippingPlanes: ROOM_CLIP }));
    zm.material.userData.own = true; zm.rotation.x = -Math.PI / 2; zm.position.set(0, 0.006, zc); over.add(zm);
    const pts = [[-zw / 2, -zd / 2], [zw / 2, -zd / 2], [zw / 2, zd / 2], [-zw / 2, zd / 2], [-zw / 2, -zd / 2]].map(([x, y]) => new V3(x, 0.007, y + zc));
    const ln = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineDashedMaterial({ color: col, dashSize: 0.1, gapSize: 0.06, transparent: true, opacity: 0.9, clippingPlanes: ROOM_CLIP }));
    ln.computeLineDistances(); ln.material.userData.own = true; over.add(ln);
    o.zone = zm; o.zoneLine = ln; o.zoneColor = col;
  }
  const tagEl = document.createElement('div'); tagEl.className = 'name-tag'; tagEl.textContent = def.name;
  const [, y1] = vRange(it);
  o.tag = new CSS2DObject(tagEl); o.tag.position.set(0, Math.min(y1, doc.room.h) + 0.05, def.flat ? it.d / 2 - 0.25 : 0); over.add(o.tag);
  o.tag.userData.hideTag = def.wall && (it.elev || 0) > 1;
  overG.add(over);
  itemObjs.set(it.id, o);
  placeItemObj(it);
  if (ui.sel?.kind === 'item' && ui.sel.id === it.id) showSelBox();
  updateVisibility();
}
function placeItemObj(it) {
  const o = itemObjs.get(it.id); if (!o) return;
  const def = CATALOG[it.type];
  o.g.position.set(it.x, def.hang ? 0 : it.elev || 0, it.z);
  o.g.rotation.y = -it.rot * DEG;
  o.over.position.set(it.x, 0, it.z);
  o.over.rotation.y = -it.rot * DEG;
}
function rebuildItem(it) {
  const o = itemObjs.get(it.id);
  if (o) { disposeTree(o.g); disposeTree(o.over); itemsG.remove(o.g); overG.remove(o.over); itemObjs.delete(it.id); }
  addItemObj(it);
  refreshAnalysis();
}
function showSelBox() {
  for (const [, o] of itemObjs) if (o.sel) { o.sel.geometry.dispose(); o.over.remove(o.sel); o.sel = null; }
  if (ui.sel?.kind !== 'item') return;
  const it = findSel(), o = itemObjs.get(it?.id); if (!it || !o) return;
  const [y0, y1] = vRange(it);
  const geo = new THREE.EdgesGeometry(new THREE.BoxGeometry(it.w + 0.04, y1 - y0 + 0.02, it.d + 0.04));
  const ln = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: 0xffc400, depthTest: false, transparent: true }));
  ln.position.y = (y0 + y1) / 2; ln.renderOrder = 30;
  o.over.add(ln); o.sel = ln;
}

/* ---------------------------------------------------------------------------
   Contrôles : chevauchements, plafond, portes, zones
--------------------------------------------------------------------------- */
function vRange(it) {
  const def = CATALOG[it.type];
  if (def.hang) { const H = doc.room.h, top = Math.max(it.h + 0.3, H - 0.45); return [top - it.h, H]; }
  const e = it.elev || 0; return [e, e + it.h];
}
function footprint(it, pad = null) {
  const th = -it.rot * DEG, c = Math.cos(th), s = Math.sin(th);
  const x0 = -it.w / 2 - (pad?.s || 0), x1 = it.w / 2 + (pad?.s || 0), z0 = -it.d / 2 - (pad?.b || 0), z1 = it.d / 2 + (pad?.f || 0);
  return [[x0, z0], [x1, z0], [x1, z1], [x0, z1]].map(([lx, lz]) => [it.x + lx * c + lz * s, it.z - lx * s + lz * c]);
}
function halfExtents(it) {
  const th = it.rot * DEG, c = Math.abs(Math.cos(th)), s = Math.abs(Math.sin(th));
  return [c * it.w / 2 + s * it.d / 2, s * it.w / 2 + c * it.d / 2];
}
function polysOverlap(A, B) {
  for (const P of [A, B]) {
    for (let i = 0; i < P.length; i++) {
      const p1 = P[i], p2 = P[(i + 1) % P.length], ax = -(p2[1] - p1[1]), az = p2[0] - p1[0];
      const len = Math.hypot(ax, az) || 1;
      let amin = Infinity, amax = -Infinity, bmin = Infinity, bmax = -Infinity;
      for (const q of A) { const v = (q[0] * ax + q[1] * az) / len; amin = Math.min(amin, v); amax = Math.max(amax, v); }
      for (const q of B) { const v = (q[0] * ax + q[1] * az) / len; bmin = Math.min(bmin, v); bmax = Math.max(bmax, v); }
      if (amax <= bmin + 0.005 || bmax <= amin + 0.005) return false;
    }
  }
  return true;
}
function wallRect(op, depth) {
  const info = wallInfo(op.wall);
  return [[op.pos, 0], [op.pos + op.w, 0], [op.pos + op.w, depth], [op.pos, depth]].map(([u, k]) => {
    const p = info.o.clone().addScaledVector(info.u, u).addScaledVector(info.n, k); return [p.x, p.z];
  });
}
let analysis = { items: {}, global: [], bad: new Set(), soft: new Set() };
function analyze() {
  const res = { items: {}, global: [], bad: new Set(), soft: new Set() };
  const add = (id, msg, lvl = 'bad') => { (res.items[id] ||= []).push({ msg, lvl }); (lvl === 'bad' ? res.bad : res.soft).add(id); };
  const { w: W, d: D, h: H } = doc.room;
  const polys = new Map(), zones = new Map();
  for (const it of doc.items) {
    polys.set(it.id, footprint(it));
    const z = CATALOG[it.type].zone; if (z) zones.set(it.id, footprint(it, z));
  }
  for (const it of doc.items) {
    const def = CATALOG[it.type], [y0, y1] = vRange(it);
    if (polys.get(it.id).some(([x, z]) => Math.abs(x) > W / 2 + 0.006 || Math.abs(z) > D / 2 + 0.006)) add(it.id, 'Dépasse des murs');
    if (!def.hang && y1 > H + 0.001) add(it.id, `Plus haut que le plafond (${cm(y1)} cm pour ${cm(H)} cm)`);
    else if (def.pullup && H - y1 < 0.3) add(it.id, `Seulement ${cm(H - y1)} cm sous le plafond : les tractions seront difficiles`, 'soft');
    if (def.hang && y0 < 0.15) add(it.id, 'Trop long pour cette hauteur sous plafond');
  }
  const list = doc.items;
  for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
    const a = list[i], b = list[j], da = CATALOG[a.type], db = CATALOG[b.type];
    if (da.flat || db.flat || da.noCollide || db.noCollide) continue;
    const [a0, a1] = vRange(a), [b0, b1] = vRange(b);
    if (a1 <= b0 + 0.005 || b1 <= a0 + 0.005) continue;
    if (polysOverlap(polys.get(a.id), polys.get(b.id))) { add(a.id, `Chevauche « ${db.name} »`); add(b.id, `Chevauche « ${da.name} »`); }
  }
  for (const a of list) {
    const za = zones.get(a.id); if (!za) continue;
    for (const b of list) {
      if (a === b || CATALOG[b.type].flat || CATALOG[b.type].noCollide || CATALOG[b.type].zoneOk || res.items[b.id]?.some((m) => m.msg.includes(CATALOG[a.type].name))) continue;
      const [b0] = vRange(b); if (b0 > 1.2) continue;
      if (polysOverlap(za, polys.get(b.id))) add(b.id, `Empiète sur l'espace d'usage de « ${CATALOG[a.type].name} »`, 'soft');
    }
  }
  for (const op of doc.openings) {
    const info = wallInfo(op.wall);
    if (op.pos < -0.001 || op.pos + op.w > info.L + 0.001) res.global.push({ msg: `${OPEN_DEF[op.type].name} (mur ${SIDE_NAME[op.wall]}) : plus large que le mur.`, lvl: 'bad' });
    if (op.type === 'garage') {
      const zone = wallRect(op, op.h + 0.4);
      for (const it of list) {
        const [, y1] = vRange(it);
        if (CATALOG[it.type].flat || y1 < op.h - 0.05) continue;
        if (polysOverlap(zone, polys.get(it.id))) add(it.id, 'Gêne la porte de garage quand elle est ouverte');
      }
      const head = H - op.h;
      if (head < 0.3) res.global.push({ msg: `Porte de garage : ${cm(head)} cm au-dessus de l'ouverture. Il en faut environ 30 pour le rail.`, lvl: head < 0.1 ? 'bad' : 'soft' });
    }
    if (op.type === 'door') {
      const zone = wallRect(op, op.w);
      for (const it of list) {
        const [y0] = vRange(it);
        if (CATALOG[it.type].flat || y0 > 1.9) continue;
        if (polysOverlap(zone, polys.get(it.id))) add(it.id, "Bloque l'ouverture de la porte");
      }
    }
    if (op.type !== 'window' && op.h > H - 0.02) res.global.push({ msg: `${OPEN_DEF[op.type].name} plus haute que le plafond.`, lvl: 'bad' });
    if (op.type === 'window' && op.sill + op.h > H - 0.05) res.global.push({ msg: 'Fenêtre trop haute pour ce plafond.', lvl: 'bad' });
  }
  for (const s of SIDES) {
    const ops = doc.openings.filter((o) => o.wall === s).sort((a, b) => a.pos - b.pos);
    for (let i = 1; i < ops.length; i++) if (ops[i].pos < ops[i - 1].pos + ops[i - 1].w - 0.001) res.global.push({ msg: `Deux ouvertures se chevauchent sur le mur ${SIDE_NAME[s]}.`, lvl: 'bad' });
  }
  if (H < 2.4) res.global.push({ msg: `Plafond à ${cm(H)} cm : pour un développé militaire debout, compte environ 2,40 m.`, lvl: 'soft' });
  return res;
}
function refreshAnalysis() {
  analysis = analyze();
  for (const [id, o] of itemObjs) {
    if (!o.zone) continue;
    const bad = analysis.bad.has(id);
    const col = bad ? new THREE.Color('#e53935') : o.zoneColor;
    o.zone.material.color.copy(col); o.zoneLine.material.color.copy(col);
    o.zone.material.opacity = bad ? 0.26 : 0.13;
  }
  renderStatus();
}

/* ---------------------------------------------------------------------------
   Cotes : lignes d'architecte + étiquettes cliquables
--------------------------------------------------------------------------- */
let coteSegs = [];
function seg(a, b) { coteSegs.push(a.x, a.y, a.z, b.x, b.y, b.z); }
function dim(a, b, off, value, onEdit, cls = '') {
  const A = a.clone().add(off), B = b.clone().add(off);
  const along = B.clone().sub(A); if (along.lengthSq() < 1e-6) return;
  along.normalize();
  let offN = off.clone();
  if (offN.lengthSq() < 1e-8) offN = new V3(-along.z, 0, along.x); else offN.normalize();
  if (off.lengthSq() > 1e-8) {
    seg(a.clone().addScaledVector(offN, 0.06), A.clone().addScaledVector(offN, 0.08));
    seg(b.clone().addScaledVector(offN, 0.06), B.clone().addScaledVector(offN, 0.08));
  }
  seg(A, B);
  const t = along.clone().add(offN).multiplyScalar(0.055);
  seg(A.clone().sub(t), A.clone().add(t)); seg(B.clone().sub(t), B.clone().add(t));
  const wrap = document.createElement('div');
  const btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'cote ' + cls + (onEdit ? '' : ' ro');
  btn.textContent = cm(value);
  if (onEdit) {
    btn.title = 'Modifier la cote (en cm)';
    btn.addEventListener('click', (e) => { e.stopPropagation(); editCote(wrap, btn, value, onEdit); });
  }
  wrap.appendChild(btn);
  const lbl = new CSS2DObject(wrap);
  lbl.position.copy(A).add(B).multiplyScalar(0.5);
  coteG.add(lbl);
}
function editCote(wrap, btn, value, onEdit) {
  const inp = document.createElement('input');
  inp.type = 'number'; inp.className = 'cote-input'; inp.value = cm(value); inp.step = '1'; inp.min = '0';
  inp.setAttribute('aria-label', 'Nouvelle cote en centimètres');
  btn.replaceWith(inp); inp.focus(); inp.select();
  let done = false;
  const finish = (ok) => {
    if (done) return; done = true;
    if (ok) {
      const v = parseFloat(String(inp.value).replace(',', '.'));
      if (Number.isFinite(v) && v >= 0 && Math.abs(v - cm(value)) > 0.01) { onEdit(v / 100); commit(); refreshAnalysis(); renderPanels(); renderInspector(); }
    }
    updateCotes();
  };
  inp.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') finish(true); else if (e.key === 'Escape') finish(false); });
  inp.addEventListener('blur', () => finish(true));
}
function updateCotes() {
  for (const c of [...coteG.children]) { if (c.geometry) c.geometry.dispose(); coteG.remove(c); }
  coteSegs = [];
  if (!doc.opts.cotes || ui.view === 'walk') return;
  const { w: W, d: D, h: H } = doc.room, T = WALL_T, y = 0.02, plan = ui.view === 'plan';
  dim(new V3(-W / 2, y, -D / 2 - T), new V3(W / 2, y, -D / 2 - T), new V3(0, 0, -0.62), W, (v) => setRoom({ w: v }));
  dim(new V3(-W / 2 - T, y, -D / 2), new V3(-W / 2 - T, y, D / 2), new V3(-0.62, 0, 0), D, (v) => setRoom({ d: v }));
  if (!plan) dim(new V3(W / 2 + T, 0, -D / 2 - T), new V3(W / 2 + T, H, -D / 2 - T), new V3(0.3, 0, -0.3), H, (v) => setRoom({ h: v }));

  for (const side of SIDES) {
    const ops = doc.openings.filter((o) => o.wall === side).sort((a, b) => a.pos - b.pos);
    if (!ops.length) continue;
    const info = wallInfo(side);
    const base = info.o.clone().addScaledVector(info.n, -T); base.y = y;
    const P = (u) => base.clone().addScaledVector(info.u, u);
    const off = info.n.clone().multiplyScalar(-0.3);
    let cur = 0;
    ops.forEach((op) => {
      const prev = cur;
      if (op.pos - prev > 0.005) dim(P(prev), P(op.pos), off, op.pos - prev, (v) => setOpening(op, { pos: prev + v }), 'sub');
      dim(P(op.pos), P(op.pos + op.w), off, op.w, (v) => setOpening(op, { w: v }));
      cur = op.pos + op.w;
    });
    const last = ops[ops.length - 1];
    if (info.L - cur > 0.005) dim(P(cur), P(info.L), off, info.L - cur, (v) => setOpening(last, { pos: info.L - v - last.w }), 'sub');
  }

  const sel = findSel();
  if (sel && ui.sel.kind === 'opening' && !plan) {
    const info = wallInfo(sel.wall), y0 = sel.type === 'window' ? sel.sill : 0;
    const b = info.o.clone().addScaledVector(info.n, -T).addScaledVector(info.u, sel.pos);
    const off = info.n.clone().multiplyScalar(-0.15).addScaledVector(info.u, -0.15);
    dim(b.clone().setY(y0), b.clone().setY(y0 + sel.h), off, sel.h, (v) => setOpening(sel, { h: v }));
    if (sel.type === 'window') dim(b.clone().setY(0), b.clone().setY(y0), off, y0, (v) => setOpening(sel, { sill: v }), 'sub');
  }
  if (sel && ui.sel.kind === 'item') {
    const it = sel, def = CATALOG[it.type], [ex, ez] = halfExtents(it), yy = 0.03;
    const L = it.x - ex + W / 2, R = W / 2 - it.x - ex, N = it.z - ez + D / 2, S = D / 2 - it.z - ez;
    const zero = new V3();
    if (L > 0.01) dim(new V3(-W / 2, yy, it.z), new V3(it.x - ex, yy, it.z), zero, L, (v) => moveItem(it, { x: -W / 2 + v + ex }), 'sub');
    if (R > 0.01) dim(new V3(it.x + ex, yy, it.z), new V3(W / 2, yy, it.z), zero, R, (v) => moveItem(it, { x: W / 2 - v - ex }), 'sub');
    if (N > 0.01) dim(new V3(it.x, yy, -D / 2), new V3(it.x, yy, it.z - ez), zero, N, (v) => moveItem(it, { z: -D / 2 + v + ez }), 'sub');
    if (S > 0.01) dim(new V3(it.x, yy, it.z + ez), new V3(it.x, yy, D / 2), zero, S, (v) => moveItem(it, { z: D / 2 - v - ez }), 'sub');
    const th = -it.rot * DEG, c = Math.cos(th), s = Math.sin(th);
    const toW = (lx, ly, lz) => new V3(it.x + lx * c + lz * s, ly, it.z - lx * s + lz * c);
    const dirW = (lx, lz, k) => new V3(lx * c + lz * s, 0, -lx * s + lz * c).multiplyScalar(k);
    const [y0, y1] = vRange(it), top = Math.min(y1, H) + 0.01;
    const yb = plan ? top : y0 + 0.01;
    dim(toW(-it.w / 2, yb, -it.d / 2), toW(it.w / 2, yb, -it.d / 2), dirW(0, -1, 0.22), it.w, (v) => setItem(it, { w: v }));
    if (it.d > 0.05) dim(toW(-it.w / 2, yb, -it.d / 2), toW(-it.w / 2, yb, it.d / 2), dirW(-1, 0, 0.22), it.d, (v) => setItem(it, { d: v }));
    if (!plan) {
      dim(toW(it.w / 2, y0, it.d / 2), toW(it.w / 2, y1, it.d / 2), dirW(1, 1, 0.12), it.h, (v) => setItem(it, { h: v }));
      if (def.wall && it.elev > 0.01) dim(toW(-it.w / 2, 0, it.d / 2), toW(-it.w / 2, it.elev, it.d / 2), dirW(-1, 1, 0.12), it.elev, (v) => setItem(it, { elev: v }), 'sub');
    }
  }
  if (coteSegs.length) {
    for (let k = 0; k < 2; k++) {
      const geo = new LineSegmentsGeometry().setPositions(coteSegs);
      const ls = new LineSegments2(geo, coteMats[k]); ls.renderOrder = 40 + k; ls.frustumCulled = false;
      coteG.add(ls);
    }
  }
}

/* ---------------------------------------------------------------------------
   Modifications du document
--------------------------------------------------------------------------- */
function findSel() {
  if (!ui.sel) return null;
  return ui.sel.kind === 'item' ? doc.items.find((i) => i.id === ui.sel.id) : doc.openings.find((o) => o.id === ui.sel.id);
}
function setRoom(p) {
  if (p.w != null) doc.room.w = clamp(p.w, 2, 14);
  if (p.d != null) doc.room.d = clamp(p.d, 2, 14);
  if (p.h != null) doc.room.h = clamp(p.h, 2, 4.5);
  for (const op of doc.openings) {
    const L = wallInfo(op.wall).L;
    op.w = Math.min(op.w, L - 0.1); op.pos = clamp(op.pos, 0.05, Math.max(0.05, L - op.w - 0.05));
  }
  rebuildRoomAll();
}
function rebuildRoomAll() {
  buildRoom(); buildOpenings(); buildItems(); updateCotes(); syncRoomInputs(); renderStatus();
}
function setOpening(op, p) {
  const L = wallInfo(p.wall || op.wall).L;
  if (p.wall) { op.wall = p.wall; }
  if (p.w != null) op.w = clamp(p.w, 0.4, L - 0.1);
  if (p.h != null) op.h = clamp(p.h, 0.3, op.type === 'window' ? doc.room.h - op.sill - 0.05 : doc.room.h - 0.05);
  if (p.sill != null) op.sill = clamp(p.sill, 0, doc.room.h - op.h - 0.05);
  if (p.color) op.color = p.color;
  if (p.pos != null) op.pos = p.pos;
  op.pos = clamp(op.pos, 0.05, Math.max(0.05, L - op.w - 0.05));
  buildRoom(); buildOpenings();
  refreshAnalysis(); updateCotes(); updateVisibility();
}
function clampItem(it) {
  const def = CATALOG[it.type], { w: W, d: D } = doc.room;
  if (def.wall) return snapToWall(it, it.x, it.z, true);
  const [ex, ez] = halfExtents(it);
  it.x = ex * 2 > W ? 0 : clamp(it.x, -W / 2 + ex, W / 2 - ex);
  it.z = ez * 2 > D ? 0 : clamp(it.z, -D / 2 + ez, D / 2 - ez);
}
const ROT_SIDE = { 0: 'N', 90: 'E', 180: 'S', 270: 'W' };
const SIDE_ROT = { N: 0, E: 90, S: 180, W: 270 };
const normRot = (r) => ((Math.round(r) % 360) + 360) % 360;
function snapToWall(it, x, z, keepSide = false) {
  const { w: W, d: D } = doc.room;
  let side = keepSide ? ROT_SIDE[normRot(it.rot)] : null;
  if (!side) { const ds = { N: z + D / 2, S: D / 2 - z, W: x + W / 2, E: W / 2 - x }; side = Object.keys(ds).reduce((a, b) => (ds[a] <= ds[b] ? a : b)); }
  const hw = it.w / 2, hd = it.d / 2;
  it.rot = SIDE_ROT[side];
  if (side === 'N' || side === 'S') { it.z = side === 'N' ? -D / 2 + hd : D / 2 - hd; it.x = hw * 2 > W ? 0 : clamp(x, -W / 2 + hw, W / 2 - hw); }
  else { it.x = side === 'W' ? -W / 2 + hd : W / 2 - hd; it.z = hw * 2 > D ? 0 : clamp(z, -D / 2 + hw, D / 2 - hw); }
}
function moveItem(it, p) {
  if (p.x != null) it.x = p.x;
  if (p.z != null) it.z = p.z;
  clampItem(it); placeItemObj(it); refreshAnalysis(); updateCotes();
}
function setItem(it, p) {
  const def = CATALOG[it.type];
  for (const k of ['w', 'd', 'h']) if (p[k] != null) it[k] = clamp(p[k], k === 'h' && def.flat ? 0.005 : 0.05, 8);
  if (p.elev != null) it.elev = clamp(p.elev, 0, doc.room.h - it.h);
  if (p.rot != null) it.rot = ((Math.round(p.rot) % 360) + 360) % 360;
  if (p.color) it.color = p.color;
  if (def.wall) snapToWall(it, it.x, it.z, true); else clampItem(it);
  rebuildItem(it); updateCotes();
}
function rotateSel(delta) {
  const it = findSel(); if (!it || ui.sel.kind !== 'item') return;
  if (CATALOG[it.type].wall) { toast("Un élément mural suit l'orientation de son mur"); return; }
  it.rot = ((it.rot + delta) % 360 + 360) % 360;
  clampItem(it); placeItemObj(it); showSelBox(); refreshAnalysis(); updateCotes(); commit(); renderInspector();
}
function findFreeSpot(it) {
  const { w: W, d: D } = doc.room, cands = [];
  for (let x = -W / 2; x <= W / 2; x += 0.25) for (let z = -D / 2; z <= D / 2; z += 0.25) cands.push([x, z]);
  cands.sort((a, b) => Math.hypot(...a) - Math.hypot(...b));
  const others = doc.items.filter((o) => o !== it && !CATALOG[o.type].flat).map((o) => footprint(o, CATALOG[o.type].zone ? { f: 0.1, b: 0.1, s: 0.1 } : null));
  for (const [x, z] of cands) {
    it.x = x; it.z = z; clampItem(it);
    const fp = footprint(it, { f: 0.1, b: 0.1, s: 0.1 });
    if (CATALOG[it.type].flat || !others.some((o) => polysOverlap(o, fp))) return;
  }
  it.x = 0; it.z = 0; clampItem(it);
}
function addItem(type, at = null) {
  const it = mkItem(type, 0, 0, 0);
  if (at) { it.x = at.x; it.z = at.z; if (CATALOG[type].wall) snapToWall(it, at.x, at.z); else clampItem(it); }
  else if (CATALOG[type].wall) { snapToWall(it, 0, -doc.room.d / 2); findWallSpot(it); }
  else findFreeSpot(it);
  doc.items.push(it);
  addItemObj(it); refreshAnalysis();
  select({ kind: 'item', id: it.id });
  commit(); renderPanels();
  toast(`${CATALOG[type].name} ajouté`);
}
function findWallSpot(it) {
  const { w: W, d: D } = doc.room;
  const spots = [];
  for (const side of SIDES) {
    const info = wallInfo(side);
    for (let u = it.w / 2 + 0.1; u <= info.L - it.w / 2 - 0.1; u += 0.2) { const p = info.o.clone().addScaledVector(info.u, u).addScaledVector(info.n, 0.3); spots.push([p.x, p.z]); }
  }
  for (const [x, z] of spots) {
    snapToWall(it, x, z);
    const fp = footprint(it), [y0, y1] = vRange(it);
    const hit = doc.items.some((o) => { if (o === it || CATALOG[o.type].flat) return false; const [b0, b1] = vRange(o); return !(y1 <= b0 || b1 <= y0) && polysOverlap(footprint(o), fp); })
      || doc.openings.some((op) => polysOverlap(wallRect(op, 0.3), fp));
    if (!hit) return;
  }
  snapToWall(it, 0, -D / 2); void W;
}
function duplicateSel() {
  const s = findSel(); if (!s) return;
  if (ui.sel.kind === 'item') {
    const it = { ...s, id: uid() };
    it.x += 0.3; it.z += 0.3;
    if (CATALOG[it.type].wall) snapToWall(it, it.x, it.z, true); else clampItem(it);
    doc.items.push(it); addItemObj(it); refreshAnalysis(); select({ kind: 'item', id: it.id });
  } else {
    const op = { ...s, id: uid(), pos: s.pos + s.w + 0.3 };
    doc.openings.push(op); setOpening(op, {}); select({ kind: 'opening', id: op.id });
  }
  commit(); renderPanels(); toast('Dupliqué');
}
function deleteSel() {
  const s = findSel(); if (!s) return;
  if (ui.sel.kind === 'item') {
    doc.items = doc.items.filter((i) => i !== s);
    const o = itemObjs.get(s.id); if (o) { disposeTree(o.g); disposeTree(o.over); itemsG.remove(o.g); overG.remove(o.over); itemObjs.delete(s.id); }
    toast(`${CATALOG[s.type].name} supprimé · Ctrl+Z pour annuler`);
  } else {
    doc.openings = doc.openings.filter((o) => o !== s);
    buildRoom(); buildOpenings();
    toast(`${OPEN_DEF[s.type].name} supprimée · Ctrl+Z pour annuler`);
  }
  ui.sel = null;
  refreshAnalysis(); updateCotes(); commit(); renderPanels(); renderInspector();
}
function addOpening(type) {
  const side = type === 'garage' ? 'S' : type === 'door' ? 'E' : 'N';
  const def = OPEN_DEF[type];
  let best = null;
  for (const s of [side, ...SIDES.filter((x) => x !== side)]) {
    const L = wallInfo(s).L;
    const ops = doc.openings.filter((o) => o.wall === s).sort((a, b) => a.pos - b.pos);
    let cur = 0.15;
    for (const o of [...ops, { pos: L - 0.1, w: 0 }]) {
      if (o.pos - cur >= Math.min(def.w, L - 0.3)) { best = { s, pos: cur + (o.pos - cur - Math.min(def.w, L - 0.3)) / 2 }; break; }
      cur = o.pos + o.w + 0.15;
    }
    if (best) break;
  }
  if (!best) { toast('Plus de place sur les murs pour cette ouverture'); return; }
  const op = mkOpen(type, best.s, best.pos);
  op.w = Math.min(op.w, wallInfo(best.s).L - 0.3);
  op.h = Math.min(op.h, doc.room.h - (type === 'garage' ? 0.3 : 0.1));
  if (type === 'window') op.sill = Math.min(op.sill, doc.room.h - op.h - 0.15);
  doc.openings.push(op);
  buildRoom(); buildOpenings(); refreshAnalysis();
  select({ kind: 'opening', id: op.id });
  commit(); renderPanels();
  toast(`${def.name} ajoutée sur le mur ${SIDE_NAME[best.s]}`);
}
function toggleOpening(op) {
  if (!op || op.type === 'window') return;
  op.open = op.open ? 0 : 1;
  commit(); renderInspector();
}

/* ---------------------------------------------------------------------------
   Vues et caméras
--------------------------------------------------------------------------- */
let orthoVS = 5;
let viewTween = null;
function aspect() { const r = stageEl.getBoundingClientRect(); return Math.max(0.2, r.width / Math.max(1, r.height)); }
function setOrthoFrustum() {
  const a = aspect();
  ortho.left = -orthoVS * a; ortho.right = orthoVS * a; ortho.top = orthoVS; ortho.bottom = -orthoVS;
  ortho.updateProjectionMatrix();
}
function fitView() {
  const { w, d, h } = doc.room, a = aspect();
  if (ui.view === 'plan') {
    orthoVS = Math.max(d / 2 + 1.3, (w / 2 + 1.3) / a);
    ctlO.target.set(0, 0, 0); ortho.position.set(0, 60, 0.0001); ortho.zoom = 1; setOrthoFrustum(); ctlO.update();
  } else if (ui.view === 'iso') {
    orthoVS = Math.max((w + d) * 0.215 + h * 0.42 + 0.7, ((w + d) * 0.36 + 0.9) / a);
    ctlO.target.set(0, h * 0.22, 0);
    placeSph(ortho, ctlO.target, ISO_POLAR, ui.isoAz, 60);
    ortho.zoom = 1; setOrthoFrustum(); ctlO.update();
  } else if (ui.view === 'orbit') {
    const r = Math.max(w, d) * 1.25 + 2;
    ctlP.target.set(0, 0.8, 0);
    placeSph(persp, ctlP.target, 1.0, ui.isoAz, r);
    persp.fov = 50; persp.updateProjectionMatrix(); ctlP.update();
  }
}
function placeSph(cam, target, polar, az, r) {
  cam.position.set(target.x + r * Math.sin(polar) * Math.sin(az), target.y + r * Math.cos(polar), target.z + r * Math.sin(polar) * Math.cos(az));
  cam.lookAt(target);
}
function setView(v) {
  if (v === ui.view && v !== 'walk') { fitView(); return; }
  const prev = ui.view;
  if (prev === 'walk') exitWalk();
  ui.view = v;
  $$('.views button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.view === v)));
  ctlO.enabled = false; ctlP.enabled = false;
  if (v === 'plan' || v === 'iso') {
    camera = ortho; ctlO.enabled = true;
    if (v === 'plan') {
      ctlO.enableRotate = false; ctlO.minPolarAngle = 0; ctlO.maxPolarAngle = 0; ctlO.minAzimuthAngle = 0; ctlO.maxAzimuthAngle = 0;
      ctlO.mouseButtons = { LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };
      ctlO.touches = { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_PAN };
    } else {
      ctlO.enableRotate = true; ctlO.minPolarAngle = ISO_POLAR; ctlO.maxPolarAngle = ISO_POLAR; ctlO.minAzimuthAngle = -Infinity; ctlO.maxAzimuthAngle = Infinity;
      ctlO.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };
      ctlO.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
    }
  } else if (v === 'orbit') {
    camera = persp; ctlP.enabled = true;
  } else {
    camera = persp; enterWalk();
  }
  if (v !== 'walk') fitView();
  $('#viewTools').hidden = v === 'walk';
  $('#btnRotL').hidden = $('#btnRotR').hidden = v === 'plan';
  $('#walkHud').hidden = v !== 'walk';
  for (const s of SIDES) if (cutState[s]) { cutState[s] = false; buildWall(s); }
  updateBackground(); updateVisibility(); updateCotes(); renderInspector(); onResize();
}
function rotateView(delta) {
  const ctl = activeCtl(); if (!ctl) return;
  const cam = camera, t = ctl.target, off = cam.position.clone().sub(t);
  const sph = new THREE.Spherical().setFromVector3(off);
  viewTween = { ctl, from: sph.theta, to: sph.theta + delta, phi: sph.phi, r: sph.radius, t: 0 };
}
function stepTween(dt) {
  if (!viewTween) return;
  const tw = viewTween; tw.t = Math.min(1, tw.t + dt / 0.45);
  const e = tw.t < 0.5 ? 2 * tw.t * tw.t : 1 - Math.pow(-2 * tw.t + 2, 2) / 2;
  const th = tw.from + (tw.to - tw.from) * e;
  const t = tw.ctl.target;
  camera.position.set(t.x + tw.r * Math.sin(tw.phi) * Math.sin(th), t.y + tw.r * Math.cos(tw.phi), t.z + tw.r * Math.sin(tw.phi) * Math.cos(th));
  camera.lookAt(t); tw.ctl.update();
  if (tw.t >= 1) viewTween = null;
}
function updateVisibility() {
  const v = ui.view, persp3 = v === 'orbit' || v === 'walk';
  if (ceilingMesh) ceilingMesh.visible = v === 'walk';
  fixturesG.visible = v === 'walk';
  outsideG.visible = persp3;
  if (gridLines) gridLines.visible = doc.opts.grid && (v === 'plan' || v === 'iso');
  const zones = doc.opts.zones && v !== 'walk';
  for (const [id, o] of itemObjs) {
    const it = doc.items.find((i) => i.id === id);
    if (o.zone) { o.zone.visible = zones; o.zoneLine.visible = zones; }
    if (o.sel) o.sel.visible = v !== 'walk';
    if (o.tag) o.tag.visible = v === 'plan' && doc.opts.labels && !o.tag.userData.hideTag;
    const def = it && CATALOG[it.type];
    o.g.visible = !(def?.wall && def.elev != null && cutState[ROT_SIDE[normRot(it.rot)]]);
    o.g.traverse((m) => {
      if (m.userData.reflector) m.visible = v === 'walk';
      if (m.userData.fakeMirror) m.visible = v !== 'walk';
    });
  }
  for (const op of doc.openings) {
    const o = openObjs.get(op.id); if (!o) continue;
    o.g.visible = !cutState[op.wall];
    o.g.traverse((m) => { if (m.userData.zoneOnly) m.visible = zones && v !== 'orbit'; if (m.userData.ceil) m.visible = v !== 'plan'; });
  }
  coteG.visible = v !== 'walk';
}
function updateCutaway() {
  const v = ui.view;
  for (const s of SIDES) {
    let want = false;
    if ((v === 'iso' || v === 'orbit') && doc.wallMode !== 'full') {
      if (doc.wallMode === 'low') want = true;
      else {
        const info = wallInfo(s), c = info.o.clone().addScaledVector(info.u, info.L / 2);
        want = camera.position.clone().sub(c).dot(info.n) < -0.05;
      }
    }
    if (want !== cutState[s]) { cutState[s] = want; buildWall(s); updateVisibility(); }
  }
}

/* ---------------------------------------------------------------------------
   Interaction : sélection, glisser-déposer, raccourcis
--------------------------------------------------------------------------- */
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
let drag = null, down = null;
function setRay(e) {
  const r = renderer.domElement.getBoundingClientRect();
  ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
}
function visibleChain(o) { while (o) { if (!o.visible) return false; o = o.parent; } return true; }
function pickAt(e) {
  setRay(e);
  const hits = ray.intersectObjects([itemsG, openG, roomG], true);
  for (const h of hits) {
    if (!visibleChain(h.object) || h.object.userData.zoneOnly) continue;
    let o = h.object;
    while (o) {
      if (o.userData.itemId) {
        const it = doc.items.find((i) => i.id === o.userData.itemId);
        if (it && CATALOG[it.type].flat && hits.some((k) => k.object.userData.itemId && k.object.userData.itemId !== it.id && visibleChain(k.object))) break;
        return { kind: 'item', id: o.userData.itemId };
      }
      if (o.userData.openId) return { kind: 'opening', id: o.userData.openId };
      if (o.userData.wall) return { kind: 'wall', side: o.userData.wall };
      if (o.userData.floor) return { kind: 'floor' };
      o = o.parent;
    }
  }
  return null;
}
function floorPoint(e, y = 0) {
  setRay(e);
  const p = new V3();
  return ray.ray.intersectPlane(new THREE.Plane(UP, -y), p) ? p : null;
}
function onPointerDown(e) {
  if (ui.view === 'walk') { walkPointerDown(e); return; }
  if (e.button !== 0) return;
  const hit = pickAt(e);
  down = { x: e.clientX, y: e.clientY, hit, moved: false };
  if (hit?.kind === 'item' || hit?.kind === 'opening') {
    select({ kind: hit.kind, id: hit.id });
    const p = floorPoint(e); if (!p) return;
    if (hit.kind === 'item') {
      const it = findSel();
      drag = { kind: 'item', it, off: { x: it.x - p.x, z: it.z - p.z }, moved: false };
    } else {
      const op = findSel(), info = wallInfo(op.wall);
      drag = { kind: 'opening', op, uOff: op.pos - p.clone().sub(info.o).dot(info.u), moved: false };
    }
    ctlO.enabled = false; ctlP.enabled = false;
    renderer.domElement.setPointerCapture(e.pointerId);
  }
}
function onPointerMove(e) {
  if (ui.view === 'walk') { walkPointerMove(e); return; }
  if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 4) down.moved = true;
  if (!drag) { hoverCursor(e); return; }
  if (!down?.moved) return;
  const p = floorPoint(e); if (!p) return;
  const step = doc.opts.snap && !e.altKey ? 0.05 : 0.01;
  drag.moved = true;
  if (drag.kind === 'item') {
    const it = drag.it, def = CATALOG[it.type];
    let x = snap(p.x + drag.off.x, step), z = snap(p.z + drag.off.z, step);
    if (def.wall) snapToWall(it, x, z); else { it.x = x; it.z = z; clampItem(it); }
    placeItemObj(it); if (def.wall) showSelBox();
    refreshAnalysis(); updateCotes();
  } else {
    const op = drag.op, info = wallInfo(op.wall);
    op.pos = clamp(snap(p.clone().sub(info.o).dot(info.u) + drag.uOff, step), 0.05, Math.max(0.05, info.L - op.w - 0.05));
    buildWall(op.wall); buildOpening(op); updateVisibility(); refreshAnalysis(); updateCotes();
  }
}
function onPointerUp(e) {
  if (ui.view === 'walk') { walkPointerUp(e); return; }
  if (drag) {
    if (drag.moved) { if (drag.kind === 'opening') buildRoom(); commit(); renderPanels(); }
    renderInspector();
    drag = null;
    const c = activeCtl(); if (c) c.enabled = true;
  } else if (down && !down.moved && e.button === 0) {
    if (!down.hit || down.hit.kind === 'floor') select(null);
    else if (down.hit.kind === 'wall') { select(null); focusWall(down.hit.side); }
  }
  down = null;
}
let hoverT = 0;
function hoverCursor(e) {
  const now = performance.now(); if (now - hoverT < 60) return; hoverT = now;
  const h = pickAt(e);
  renderer.domElement.style.cursor = h?.kind === 'item' || h?.kind === 'opening' ? 'grab' : h?.kind === 'wall' ? 'pointer' : '';
}
function select(sel) {
  ui.sel = sel;
  showSelBox(); updateCotes(); renderInspector(); renderLists();
}
function focusWall(side) {
  switchTab('walls');
  const card = $(`.wall-card[data-side="${side}"]`);
  if (card) { card.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); card.classList.add('flash'); setTimeout(() => card.classList.remove('flash'), 900); }
  toast(`Mur ${SIDE_NAME[side]} : choisis son revêtement dans le panneau`);
}
function isTyping(t) { return t && (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA' || t.isContentEditable); }
function onKeyDown(e) {
  if (isTyping(e.target) || !$('#modal').hidden) return;
  const k = e.key, ctrl = e.ctrlKey || e.metaKey;
  if (ctrl && k.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
  if (ctrl && k.toLowerCase() === 'y') { e.preventDefault(); redo(); return; }
  if (ctrl && k.toLowerCase() === 'd') { e.preventDefault(); duplicateSel(); return; }
  if (ctrl) return;
  if (ui.view === 'walk') {
    walk.keys[e.code] = true;
    if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
    if (e.code === 'KeyO') toggleNearestDoor();
    if (k === 'Escape' && document.pointerLockElement) document.exitPointerLock();
    if (['1', '2', '3'].includes(k)) setView(['plan', 'iso', 'orbit'][+k - 1]);
    return;
  }
  if (['1', '2', '3', '4'].includes(k)) { setView(['plan', 'iso', 'orbit', 'walk'][+k - 1]); return; }
  if (k === 'Delete' || k === 'Backspace') { e.preventDefault(); deleteSel(); return; }
  if (k === 'r' || k === 'R') { rotateSel(e.shiftKey ? 15 : 90); return; }
  if (k === 'Escape') { select(null); return; }
  if (k === 'o' || k === 'O') {
    const s = findSel();
    if (s && ui.sel.kind === 'opening') toggleOpening(s);
    else { const gs = doc.openings.filter((o) => o.type === 'garage'); const open = gs.some((o) => !o.open); gs.forEach((o) => (o.open = open ? 1 : 0)); if (gs.length) commit(); }
    return;
  }
  if (k.startsWith('Arrow') && ui.sel?.kind === 'item') {
    e.preventDefault();
    const it = findSel(), st = e.shiftKey ? 0.1 : 0.01;
    const dx = k === 'ArrowLeft' ? -st : k === 'ArrowRight' ? st : 0, dz = k === 'ArrowUp' ? -st : k === 'ArrowDown' ? st : 0;
    if (CATALOG[it.type].wall) snapToWall(it, it.x + dx, it.z + dz, true); else { it.x += dx; it.z += dz; clampItem(it); }
    placeItemObj(it); refreshAnalysis(); updateCotes(); commitSoon();
  }
}
let commitTimer = 0;
function commitSoon() { clearTimeout(commitTimer); commitTimer = setTimeout(() => { commit(); renderInspector(); }, 400); }

/* ---------------------------------------------------------------------------
   Visite à la première personne
--------------------------------------------------------------------------- */
const walk = { yaw: 0, pitch: -0.05, pos: new V3(), keys: {}, joy: { x: 0, y: 0, id: null }, look: null, eye: 1.68, t: 0, helpTimer: 0 };
function enterWalk() {
  const { d } = doc.room;
  const g = doc.openings.find((o) => o.type === 'garage') || doc.openings.find((o) => o.type === 'door');
  let dir;
  if (g) {
    const info = wallInfo(g.wall);
    walk.pos.copy(info.o).addScaledVector(info.u, g.pos + g.w / 2).addScaledVector(info.n, 0.6);
    dir = info.n;
  } else { walk.pos.set(0, 0, d / 2 - 0.7); dir = new V3(0, 0, -1); }
  walk.yaw = Math.atan2(-dir.x, -dir.z); walk.pitch = -0.08;
  persp.fov = 68; persp.updateProjectionMatrix();
  const help = $('#walkHelp'); help.classList.remove('dim');
  clearTimeout(walk.helpTimer); walk.helpTimer = setTimeout(() => help.classList.add('dim'), 6000);
}
function exitWalk() {
  walk.keys = {}; walk.look = null;
  if (document.pointerLockElement) document.exitPointerLock();
  persp.fov = 50; persp.updateProjectionMatrix();
}
function walkPointerDown(e) {
  if (e.target !== renderer.domElement) return;
  walk.look = { x: e.clientX, y: e.clientY, id: e.pointerId };
  renderer.domElement.setPointerCapture(e.pointerId);
}
function walkPointerMove(e) {
  if (document.pointerLockElement === renderer.domElement) { walk.yaw -= e.movementX * 0.0025; walk.pitch = clamp(walk.pitch - e.movementY * 0.0025, -1.35, 1.35); return; }
  if (!walk.look || e.pointerId !== walk.look.id) return;
  const k = e.pointerType === 'touch' ? 0.006 : 0.004;
  walk.yaw -= (e.clientX - walk.look.x) * k; walk.pitch = clamp(walk.pitch - (e.clientY - walk.look.y) * k, -1.35, 1.35);
  walk.look.x = e.clientX; walk.look.y = e.clientY;
}
function walkPointerUp(e) { if (walk.look && e.pointerId === walk.look.id) walk.look = null; }
function blocked(x, z) {
  const pad = 0.22;
  if (Math.abs(x) > 16 || Math.abs(z) > 16) return true;
  const p = new V3(x, 0, z);
  for (const side of SIDES) {
    const info = wallInfo(side), rel = p.clone().sub(info.o), s = -rel.dot(info.n), u = rel.dot(info.u);
    if (s > -pad && s < WALL_T + pad && u > -WALL_T - pad && u < info.L + WALL_T + pad) {
      const gap = doc.openings.find((op) => op.wall === side && op.type !== 'window' && (openObjs.get(op.id)?.f || 0) > 0.85 && u > op.pos + pad && u < op.pos + op.w - pad);
      if (!gap) return true;
    }
  }
  for (const it of doc.items) {
    const def = CATALOG[it.type]; if (def.flat) continue;
    const [y0] = vRange(it); if (y0 > 1.3) continue;
    const th = -it.rot * DEG, dx = x - it.x, dz = z - it.z;
    const lx = dx * Math.cos(th) - dz * Math.sin(th), lz = dx * Math.sin(th) + dz * Math.cos(th);
    if (Math.abs(lx) < it.w / 2 + 0.15 && Math.abs(lz) < it.d / 2 + 0.15) return true;
  }
  return false;
}
function walkUpdate(dt) {
  const K = walk.keys;
  let f = (K.KeyW || K.ArrowUp ? 1 : 0) - (K.KeyS || K.ArrowDown ? 1 : 0) - walk.joy.y;
  let s = (K.KeyD || K.ArrowRight ? 1 : 0) - (K.KeyA || K.ArrowLeft ? 1 : 0) + walk.joy.x;
  const len = Math.hypot(f, s); if (len > 1) { f /= len; s /= len; }
  const speed = (K.ShiftLeft || K.ShiftRight ? 3.2 : 1.6) * dt;
  const fx = -Math.sin(walk.yaw), fz = -Math.cos(walk.yaw), rx = Math.cos(walk.yaw), rz = -Math.sin(walk.yaw);
  const mx = (fx * f + rx * s) * speed, mz = (fz * f + rz * s) * speed;
  const stuck = blocked(walk.pos.x, walk.pos.z);
  if (mx && (stuck || !blocked(walk.pos.x + mx, walk.pos.z))) walk.pos.x += mx;
  if (mz && (stuck || !blocked(walk.pos.x, walk.pos.z + mz))) walk.pos.z += mz;
  const moving = Math.abs(mx) + Math.abs(mz) > 0;
  if (moving) walk.t += dt * (K.ShiftLeft || K.ShiftRight ? 11 : 8);
  const bob = moving ? Math.sin(walk.t) * 0.018 : 0;
  persp.position.set(walk.pos.x, Math.min(walk.eye, doc.room.h - 0.12) + bob, walk.pos.z);
  persp.rotation.set(walk.pitch, walk.yaw, 0, 'YXZ');
}
function toggleNearestDoor() {
  let best = null, bd = 6;
  for (const op of doc.openings) {
    if (op.type === 'window') continue;
    const { c } = openingFrame(op), dd = Math.hypot(c.x - persp.position.x, c.z - persp.position.z);
    if (dd < bd) { bd = dd; best = op; }
  }
  if (best) { best.open = best.open ? 0 : 1; commit(); toast(`${OPEN_DEF[best.type].name} ${best.open ? 'ouverte' : 'fermée'}`); }
  else toast('Aucune porte à proximité');
}
function setupJoystick() {
  const joy = $('#joy'), knob = joy.querySelector('.knob');
  const upd = (e) => {
    const r = joy.getBoundingClientRect(), cx = r.left + r.width / 2, cyy = r.top + r.height / 2;
    let dx = (e.clientX - cx) / 50, dy = (e.clientY - cyy) / 50; const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; }
    walk.joy.x = dx; walk.joy.y = dy; knob.style.transform = `translate(${dx * 36}px, ${dy * 36}px)`;
  };
  joy.addEventListener('pointerdown', (e) => { e.stopPropagation(); walk.joy.id = e.pointerId; joy.setPointerCapture(e.pointerId); upd(e); });
  joy.addEventListener('pointermove', (e) => { if (e.pointerId === walk.joy.id) upd(e); });
  const end = (e) => { if (e.pointerId !== walk.joy.id) return; walk.joy = { x: 0, y: 0, id: null }; knob.style.transform = ''; };
  joy.addEventListener('pointerup', end); joy.addEventListener('pointercancel', end);
}

/* ---------------------------------------------------------------------------
   Panneaux de réglages
--------------------------------------------------------------------------- */
function switchTab(t) {
  $$('.tabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === t));
  $$('.pane').forEach((p) => p.classList.toggle('on', p.dataset.pane === t));
}
const roomFields = [['roomW', 'w'], ['roomD', 'd'], ['roomH', 'h']];
function syncRoomInputs() {
  for (const [id, k] of roomFields) {
    const v = cm(doc.room[k]);
    if (document.activeElement !== $('#' + id)) $('#' + id).value = v;
    $('#' + id + 'r').value = v;
  }
}
function renderSwatches(el, kind, current, color) {
  const defs = kind === 'floor' ? FLOOR_SURF : WALL_SURF;
  el.innerHTML = Object.entries(defs).map(([k, d]) => `<button type="button" class="swatch${k === current ? ' on' : ''}" data-mat="${k}" aria-pressed="${k === current}"><img alt="" src="${swatchURL(kind, k, k === current ? color : d.color)}"><span>${esc(d.label)}</span></button>`).join('');
}
function renderRoomPanel() {
  syncRoomInputs();
  renderSwatches($('#floorSwatches'), 'floor', doc.floor.mat, doc.floor.color);
  $('#floorColor').value = doc.floor.color;
  $$('#lightSeg button').forEach((b) => b.classList.toggle('on', b.dataset.light === doc.light));
  $('#wallMode').value = doc.wallMode;
  $('#optCotes').checked = doc.opts.cotes; $('#optZones').checked = doc.opts.zones; $('#optGrid').checked = doc.opts.grid;
  $('#optSnap').checked = doc.opts.snap; $('#optLabels').checked = doc.opts.labels;
}
function renderWallCards() {
  $('#wallCards').innerHTML = SIDES.map((s) => {
    const wl = doc.walls[s], L = wallInfo(s).L;
    return `<div class="wall-card" data-side="${s}"><header><h4>Mur ${SIDE_NAME[s]}</h4><span>${cm(L)} cm</span></header><div class="swatches"></div>
      <div class="foot"><label class="color-field"><span>Teinte</span><input type="color" value="${wl.color}" data-wall-color="${s}" aria-label="Teinte du mur ${SIDE_NAME[s]}"></label>
      <button type="button" class="btn" data-wall-all="${s}">Appliquer partout</button></div></div>`;
  }).join('');
  for (const s of SIDES) renderSwatches($(`.wall-card[data-side="${s}"] .swatches`), 'wall', doc.walls[s].mat, doc.walls[s].color);
}
function renderLists() {
  const ol = $('#openList');
  ol.innerHTML = doc.openings.length ? doc.openings.map((op) => `<li data-open="${op.id}" class="${ui.sel?.id === op.id ? 'on' : ''}"><span class="dot" style="background:${op.color}"></span><span class="name">${esc(OPEN_DEF[op.type].name)}</span><span class="meta">mur ${SIDE_NAME[op.wall]} · ${cm(op.w)}×${cm(op.h)}</span></li>`).join('')
    : '<li class="empty">Aucune ouverture pour l\'instant.</li>';
  const il = $('#itemList');
  il.innerHTML = doc.items.length ? doc.items.map((it) => `<li data-item="${it.id}" class="${ui.sel?.id === it.id ? 'on' : ''}"><span class="dot" style="background:${CATS[CATALOG[it.type].cat].color}"></span><span class="name">${esc(CATALOG[it.type].name)}</span>${analysis.bad.has(it.id) ? '<span class="warn-dot" title="À vérifier"></span>' : ''}<span class="meta">${cm(it.w)}×${cm(it.d)}</span></li>`).join('')
    : '<li class="empty">Ta salle est vide : pioche dans le catalogue.</li>';
}
function renderCatalog() {
  const byCat = {};
  for (const [k, d] of Object.entries(CATALOG)) (byCat[d.cat] ||= []).push([k, d]);
  $('#catalog').innerHTML = Object.entries(CATS).map(([ck, c]) => `<div class="cat"><h4><i style="background:${c.color}"></i>${esc(c.label)}</h4><div class="cards">${(byCat[ck] || []).map(([k, d]) => `
    <button type="button" class="card" data-type="${k}" draggable="true" title="Ajouter : ${esc(d.name)}"><div class="thumb"><img alt="" data-thumb="${k}"></div><b>${esc(d.name)}</b><small>${cm(d.w)} × ${cm(d.d)} × ${cm(d.h)} cm · ${euro(d.price)}</small></button>`).join('')}</div></div>`).join('');
  if (thumbs) applyThumbs();
}
function renderProject() {
  if (document.activeElement !== $('#projName')) $('#projName').value = doc.name;
  const s = stats();
  $('#stats').innerHTML = `
    <dt>Budget équipement</dt><dd class="big">${euro(s.budget)}</dd>
    <dt>Surface au sol</dt><dd>${s.area.toFixed(1).replace('.', ',')} m²</dd>
    <dt>Volume</dt><dd>${s.vol.toFixed(1).replace('.', ',')} m³</dd>
    <dt>Équipements</dt><dd>${doc.items.length}</dd>
    <dt>Emprise des machines</dt><dd>${s.occ} %</dd>
    <dt>Ouvertures</dt><dd>${doc.openings.length}</dd>`;
  const checks = [...analysis.global];
  for (const it of doc.items) for (const w of analysis.items[it.id] || []) checks.push({ msg: `${CATALOG[it.type].name} : ${w.msg}`, lvl: w.lvl });
  $('#checkList').innerHTML = checks.length ? checks.map((c) => `<li class="${c.lvl === 'bad' ? 'bad' : ''}">${esc(c.msg)}</li>`).join('') : '<li class="good">Tout est en ordre : pas de chevauchement, ça passe sous le plafond.</li>';
}
function stats() {
  const { w, d, h } = doc.room;
  let budget = 0, foot = 0;
  for (const it of doc.items) { const def = CATALOG[it.type]; budget += def.priceOf ? def.priceOf(it) : def.price; if (!def.flat && !def.wall && !def.hang) foot += it.w * it.d; }
  return { area: w * d, vol: w * d * h, budget, occ: Math.round((foot / (w * d)) * 100) };
}
function renderStatus() {
  const s = stats(), nWarn = analysis.bad.size + analysis.global.filter((g) => g.lvl === 'bad').length;
  $('#status').innerHTML = `<span class="chip"><b>${s.area.toFixed(1).replace('.', ',')}</b> m²</span><span class="chip">${doc.items.length} équip.</span><span class="chip">≈ <b>${euro(s.budget)}</b></span>`
    + (nWarn ? `<button type="button" class="chip warn" id="chipWarn">${nWarn} point${nWarn > 1 ? 's' : ''} à vérifier</button>` : '<span class="chip okc opt">Tout passe</span>')
    + '<span class="chip opt">Cotes en cm</span>';
  if ($('#chipWarn')) $('#chipWarn').onclick = () => { switchTab('project'); renderProject(); };
  renderProject();
  renderListsWarn();
}
function renderListsWarn() { if (!drag) renderLists(); }
function renderPanels() { renderRoomPanel(); renderWallCards(); renderLists(); renderProject(); }

function renderInspector() {
  const el = $('#inspector'), s = findSel();
  if (!s || ui.view === 'walk') { el.hidden = true; el.innerHTML = ''; return; }
  el.hidden = false;
  if (ui.sel.kind === 'item') {
    const def = CATALOG[s.type], cat = CATS[def.cat], warns = analysis.items[s.id] || [];
    el.innerHTML = `
      <div class="insp-head"><span class="dot" style="background:${cat.color}"></span><h2>${esc(def.name)}${s.variant === 'stack' ? ' PRO' : ''}${s.evo ? ' + EVO Arm' : ''}<small>${esc(cat.label)} · env. ${euro(def.priceOf ? def.priceOf(s) : def.price)}</small></h2>
        <button type="button" class="icon-btn" data-act="close" aria-label="Fermer"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>
      <div class="insp-grid">
        <label>Largeur<input type="number" data-f="w" value="${cm(s.w)}" min="5" step="1"></label>
        <label>Profondeur<input type="number" data-f="d" value="${cm(s.d)}" min="${def.flat ? 1 : 5}" step="1"></label>
        <label>Hauteur<input type="number" data-f="h" value="${cm(s.h)}" min="1" step="1"></label>
      </div>
      ${def.wall && def.elev != null ? `<div class="insp-grid two"><label>Fixé à (cm du sol)<input type="number" data-f="elev" value="${cm(s.elev)}" min="0" step="1"></label><label>Mur<input type="text" value="${esc(SIDE_NAME[ROT_SIDE[normRot(s.rot)] || 'N'])}" disabled></label></div>` : `
      <span class="lbl-sm">Rotation</span>
      <div class="rot-row">
        <button type="button" class="btn" data-rot="-90" title="Maj+R : 15°">−90°</button><button type="button" class="btn" data-rot="-15">−15°</button>
        <button type="button" class="btn" data-rot="15">+15°</button><button type="button" class="btn" data-rot="90" title="Touche R">+90°</button></div>
      <div class="insp-grid two"><label>Angle (°)<input type="number" data-f="rot" value="${Math.round(s.rot)}" step="1"></label><label>Couleur<input type="color" data-f="color" value="${s.color}"></label></div>`}
      ${def.wall ? `<div class="insp-row"><span class="lbl">Couleur</span><input type="color" data-f="color" value="${s.color}"></div>` : ''}
      ${def.variants ? `<div class="seg seg2"><button type="button" data-act="variant" data-v="plates" class="${s.variant === 'stack' ? '' : 'on'}">Chargement disques</button><button type="button" data-act="variant" data-v="stack" class="${s.variant === 'stack' ? 'on' : ''}">PRO · pile 95 kg</button></div>` : ''}
      ${def.evo ? `<button type="button" class="btn" data-act="evo">${s.evo ? "Retirer l'EVO Arm (−199 €)" : "Monter l'EVO Arm (+199 €)"}</button>` : ''}
      ${def.lift ? `<div class="insp-grid two"><label>Posée à (cm du sol)<input type="number" data-f="elev" value="${cm(s.elev)}" min="0" step="1"></label></div><p class="hint">Tape 146 pour la poser sur les J-hooks d'un rack.</p>` : ''}
      ${def.flip ? `<button type="button" class="btn" data-act="flip">Mettre la tour à ${s.flip ? 'droite' : 'gauche'}</button>` : ''}
      ${warns.length ? `<ul class="warns">${warns.map((w) => `<li class="${w.lvl === 'soft' ? 'soft' : ''}">${esc(w.msg)}</li>`).join('')}</ul>` : '<p class="goodnote">Bien placé, rien à signaler.</p>'}
      <p class="hint">Glisse l'objet dans la vue, ou clique une cote jaune pour taper la distance au mur.</p>
      <div class="insp-actions"><button type="button" class="btn" data-act="dup">Dupliquer</button><button type="button" class="btn danger" data-act="del">Supprimer</button></div>`;
  } else {
    const def = OPEN_DEF[s.type], L = wallInfo(s.wall).L;
    el.innerHTML = `
      <div class="insp-head"><span class="dot" style="background:${s.color}"></span><h2>${esc(def.name)}<small>Mur ${SIDE_NAME[s.wall]} · ${cm(L)} cm de long</small></h2>
        <button type="button" class="icon-btn" data-act="close" aria-label="Fermer"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>
      <div class="insp-grid">
        <label>Position<input type="number" data-o="pos" value="${cm(s.pos)}" step="1" title="${SIDE_FROM[s.wall]}"></label>
        <label>Largeur<input type="number" data-o="w" value="${cm(s.w)}" min="40" step="1"></label>
        <label>Hauteur<input type="number" data-o="h" value="${cm(s.h)}" min="30" step="1"></label>
      </div>
      <p class="hint">Position mesurée ${SIDE_FROM[s.wall]}.</p>
      ${s.type === 'window' ? `<div class="insp-grid two"><label>Allège (cm du sol)<input type="number" data-o="sill" value="${cm(s.sill)}" min="0" step="1"></label></div>` : ''}
      <div class="insp-grid two"><label>Mur<select data-o="wall">${SIDES.map((x) => `<option value="${x}"${x === s.wall ? ' selected' : ''}>Mur ${SIDE_NAME[x]}</option>`).join('')}</select></label>
        <label>Couleur<input type="color" data-o="color" value="${s.color}"></label></div>
      ${s.type !== 'window' ? `<button type="button" class="btn primary" data-act="toggle">${s.open ? 'Fermer' : 'Ouvrir'} ${s.type === 'garage' ? 'la porte de garage' : 'la porte'}</button>` : ''}
      <div class="insp-actions"><button type="button" class="btn" data-act="dup">Dupliquer</button><button type="button" class="btn danger" data-act="del">Supprimer</button></div>`;
  }
}

function bindUI() {
  $$('.views button').forEach((b) => b.addEventListener('click', () => setView(b.dataset.view)));
  $$('.tabs button').forEach((b) => b.addEventListener('click', () => { switchTab(b.dataset.tab); if (b.dataset.tab === 'project') renderProject(); }));
  $('#btnUndo').addEventListener('click', undo);
  $('#btnRedo').addEventListener('click', redo);
  $('#btnShot').addEventListener('click', screenshot);
  $('#btnRotL').addEventListener('click', () => rotateView(-Math.PI / 2));
  $('#btnRotR').addEventListener('click', () => rotateView(Math.PI / 2));
  $('#btnFit').addEventListener('click', fitView);
  $('#btnPreset').addEventListener('click', () => {
    const k = $('#presetSel').value;
    if (k === 'vide') { doc.items = []; ui.sel = null; buildItems(); commit(); renderPanels(); renderInspector(); updateCotes(); toast('Pièce vidée · Ctrl+Z pour annuler'); return; }
    loadDoc(PRESETS[k](), 'Modèle chargé · Ctrl+Z pour revenir en arrière');
  });
  for (const [id, k] of roomFields) {
    const num = $('#' + id), rng = $('#' + id + 'r');
    rng.addEventListener('input', () => { num.value = rng.value; setRoom({ [k]: rng.value / 100 }); });
    rng.addEventListener('change', () => { commit(); fitView(); renderPanels(); });
    num.addEventListener('change', () => { const v = parseFloat(num.value); if (Number.isFinite(v)) { setRoom({ [k]: v / 100 }); commit(); fitView(); renderPanels(); } });
  }
  $('#floorSwatches').addEventListener('click', (e) => {
    const b = e.target.closest('.swatch'); if (!b) return;
    doc.floor.mat = b.dataset.mat; doc.floor.color = FLOOR_SURF[b.dataset.mat].color;
    floorMesh.material = surfMat('floor', doc.floor.mat, doc.floor.color); commit(); renderRoomPanel();
  });
  $('#floorColor').addEventListener('input', (e) => { doc.floor.color = e.target.value; floorMesh.material = surfMat('floor', doc.floor.mat, doc.floor.color); });
  $('#floorColor').addEventListener('change', () => { commit(); renderRoomPanel(); });
  $('#lightSeg').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    doc.light = b.dataset.light; buildRoom(); buildOpenings(); commit(); renderRoomPanel();
  });
  $('#wallMode').addEventListener('change', (e) => { doc.wallMode = e.target.value; commit(); });
  const optMap = { optCotes: 'cotes', optZones: 'zones', optGrid: 'grid', optSnap: 'snap', optLabels: 'labels' };
  for (const [id, k] of Object.entries(optMap)) $('#' + id).addEventListener('change', (e) => { doc.opts[k] = e.target.checked; updateVisibility(); updateCotes(); commit(); });

  $('#wallCards').addEventListener('click', (e) => {
    const sw = e.target.closest('.swatch'), all = e.target.closest('[data-wall-all]');
    if (sw) {
      const side = sw.closest('.wall-card').dataset.side;
      doc.walls[side] = { mat: sw.dataset.mat, color: WALL_SURF[sw.dataset.mat].color };
      buildWall(side); commit(); renderWallCards();
    } else if (all) {
      const src = doc.walls[all.dataset.wallAll];
      for (const s of SIDES) { doc.walls[s] = { ...src }; buildWall(s); }
      commit(); renderWallCards(); toast('Revêtement appliqué aux quatre murs');
    }
  });
  $('#wallCards').addEventListener('input', (e) => {
    const s = e.target.dataset.wallColor; if (!s) return;
    doc.walls[s].color = e.target.value; buildWall(s);
  });
  $('#wallCards').addEventListener('change', (e) => { if (e.target.dataset.wallColor) { commit(); renderWallCards(); } });

  $$('[data-add-open]').forEach((b) => b.addEventListener('click', () => addOpening(b.dataset.addOpen)));
  $('#openList').addEventListener('click', (e) => { const li = e.target.closest('[data-open]'); if (li) select({ kind: 'opening', id: li.dataset.open }); });
  $('#itemList').addEventListener('click', (e) => { const li = e.target.closest('[data-item]'); if (li) select({ kind: 'item', id: li.dataset.item }); });
  $('#catalog').addEventListener('click', (e) => { const c = e.target.closest('.card'); if (c) addItem(c.dataset.type); });
  $('#catalog').addEventListener('dragstart', (e) => { const c = e.target.closest('.card'); if (c) { e.dataTransfer.setData('text/plain', 'hg:' + c.dataset.type); e.dataTransfer.effectAllowed = 'copy'; } });
  stageEl.addEventListener('dragover', (e) => { if (ui.view !== 'walk') { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; } });
  stageEl.addEventListener('drop', (e) => {
    const t = e.dataTransfer.getData('text/plain'); if (!t.startsWith('hg:')) return;
    e.preventDefault();
    const type = t.slice(3); if (!CATALOG[type]) return;
    const p = floorPoint(e); addItem(type, p ? { x: snap(p.x, 0.05), z: snap(p.z, 0.05) } : null);
  });

  const insp = $('#inspector');
  insp.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act],[data-rot]'); if (!b) return;
    if (b.dataset.rot) { rotateSel(+b.dataset.rot); return; }
    const a = b.dataset.act, s = findSel();
    if (a === 'close') select(null);
    if (a === 'dup') duplicateSel();
    if (a === 'del') deleteSel();
    if (a === 'toggle') toggleOpening(s);
    if (a === 'variant') { if (b.dataset.v === 'stack') s.variant = 'stack'; else delete s.variant; rebuildItem(s); showSelBox(); commit(); renderInspector(); renderStatus(); }
    if (a === 'evo') {
      const sign = s.evo ? -1 : 1, th = -s.rot * DEG;
      s.evo = !s.evo; if (!s.evo) delete s.evo;
      s.d = Math.max(0.5, s.d + sign * EVO_EXT);
      s.x += Math.sin(th) * sign * EVO_EXT / 2; s.z += Math.cos(th) * sign * EVO_EXT / 2;
      clampItem(s); rebuildItem(s); showSelBox(); updateCotes(); commit(); renderInspector(); renderStatus();
    }
    if (a === 'flip') { s.flip = !s.flip; if (!s.flip) delete s.flip; rebuildItem(s); showSelBox(); updateCotes(); commit(); renderInspector(); }
  });
  insp.addEventListener('input', (e) => {
    const s = findSel(); if (!s) return;
    if (e.target.type !== 'color') return;
    if (e.target.dataset.f) { s.color = e.target.value; rebuildItem(s); showSelBox(); }
    if (e.target.dataset.o) { s.color = e.target.value; buildOpening(s); updateVisibility(); }
  });
  insp.addEventListener('change', (e) => {
    const s = findSel(); if (!s) return;
    const f = e.target.dataset.f, o = e.target.dataset.o;
    if (f) {
      if (f === 'color') setItem(s, { color: e.target.value });
      else { const v = parseFloat(e.target.value); if (!Number.isFinite(v)) return; setItem(s, { [f]: f === 'rot' ? v : v / 100 }); }
      showSelBox();
    } else if (o) {
      if (o === 'wall') setOpening(s, { wall: e.target.value, pos: s.pos });
      else if (o === 'color') setOpening(s, { color: e.target.value });
      else { const v = parseFloat(e.target.value); if (!Number.isFinite(v)) return; setOpening(s, { [o]: v / 100 }); }
    }
    commit(); renderInspector(); renderLists();
  });

  $('#projName').addEventListener('input', (e) => { doc.name = e.target.value; });
  $('#projName').addEventListener('change', commit);
  $('#btnExport').addEventListener('click', exportJSON);
  $('#btnCopy').addEventListener('click', copyJSON);
  $('#btnImport').addEventListener('click', importDialog);
  $('#fileImport').addEventListener('change', async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try { loadDoc(JSON.parse(await f.text()), 'Projet importé'); closeModal(); } catch { toast("Ce fichier n'est pas un projet Home Gym Studio"); }
    e.target.value = '';
  });
  $('#modalClose').addEventListener('click', closeModal);
  $('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal') closeModal(); });
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#modal').hidden) closeModal(); });

  $('#btnDoorToggle').addEventListener('click', toggleNearestDoor);
  $('#eyeH').addEventListener('input', (e) => { walk.eye = e.target.value / 100; $('#eyeOut').textContent = e.target.value + ' cm'; });
  renderer.domElement.addEventListener('dblclick', () => { if (ui.view === 'walk') renderer.domElement.requestPointerLock?.()?.catch?.(() => {}); });
  setupJoystick();
}

/* ---------------------------------------------------------------------------
   Capture, export, import
--------------------------------------------------------------------------- */
function openModal(title, html) { $('#modalTitle').textContent = title; $('#modalBody').innerHTML = html; $('#modal').hidden = false; }
function closeModal() { $('#modal').hidden = true; $('#modalBody').innerHTML = ''; }
function screenshot() {
  renderer.render(scene, camera);
  const url = renderer.domElement.toDataURL('image/png');
  const name = (doc.name || 'home-gym').replace(/[^\w\-]+/g, '-').toLowerCase();
  openModal('Capture', `<img src="${url}" alt="Capture de la vue ${esc(ui.view)}"><div class="row"><a class="btn primary" href="${url}" download="${name}-${ui.view}.png">Télécharger l'image</a></div><p class="hint">Si le téléchargement ne se lance pas, fais un clic droit ou un appui long sur l'image pour l'enregistrer.</p>`);
}
function exportJSON() {
  const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = (doc.name || 'home-gym').replace(/[^\w\-]+/g, '-').toLowerCase() + '.json';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  toast('Projet téléchargé');
}
async function copyJSON() {
  const txt = JSON.stringify(doc);
  try { await navigator.clipboard.writeText(txt); toast('Code du projet copié : colle-le dans « Importer » sur un autre appareil'); }
  catch {
    openModal('Code du projet', '<p class="hint">Sélectionne tout le texte et copie-le.</p><textarea id="codeOut" readonly></textarea>');
    const ta = $('#codeOut'); ta.value = txt; ta.focus(); ta.select();
  }
}
function importDialog() {
  openModal('Importer un projet', `<p class="hint">Colle le code d'un projet, ou choisis un fichier .json.</p><textarea id="codeIn" placeholder='{"name": "...", "room": {...}}'></textarea>
    <div class="row"><button type="button" class="btn primary" id="doImport">Importer le code</button><button type="button" class="btn" id="pickFile">Choisir un fichier</button></div>`);
  $('#doImport').onclick = () => { try { loadDoc(JSON.parse($('#codeIn').value), 'Projet importé'); closeModal(); } catch { toast("Ce code n'est pas un projet valide"); } };
  $('#pickFile').onclick = () => $('#fileImport').click();
}
let toastTimer = 0;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => (t.hidden = true), 2600); }

/* ---------------------------------------------------------------------------
   Vignettes du catalogue (rendues une fois avec un second moteur)
--------------------------------------------------------------------------- */
let thumbs = null;
function makeThumbs() {
  const prevSize = renderer.getSize(new THREE.Vector2()), prevPR = renderer.getPixelRatio(), prevExp = renderer.toneMappingExposure;
  try {
    renderer.setPixelRatio(1); renderer.setSize(240, 180, false); renderer.toneMappingExposure = 1;
    renderer.setClearColor(0x000000, 0);
    const sc = new THREE.Scene();
    sc.add(new THREE.HemisphereLight(0xffffff, 0x777777, 1.7));
    const dl = new THREE.DirectionalLight(0xffffff, 2.2); dl.position.set(3, 6, 4); sc.add(dl);
    const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
    thumbs = {};
    for (const [k, def] of Object.entries(CATALOG)) {
      const it = mkItem(k, 0, 0, 0); it.id = 'thumb-' + k;
      const g = def.build(it, { roomH: Math.max(def.h + 0.6, 2.4) });
      g.traverse((m) => { if (m.userData.reflector) m.visible = false; });
      sc.add(g);
      const box = new THREE.Box3().setFromObject(g, true), c = box.getCenter(new V3());
      cam.position.copy(c).addScaledVector(new V3(1, 0.85, 1.25).normalize(), 20); cam.lookAt(c); cam.updateMatrixWorld();
      let hw = 0, hh = 0;
      for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) {
        const p = new V3(x, y, z).applyMatrix4(cam.matrixWorldInverse); hw = Math.max(hw, Math.abs(p.x)); hh = Math.max(hh, Math.abs(p.y));
      }
      const s = Math.max(hh, hw * 0.75) * 1.12 || 1;
      Object.assign(cam, { left: -s * 4 / 3, right: s * 4 / 3, top: s, bottom: -s }); cam.updateProjectionMatrix();
      renderer.render(sc, cam);
      thumbs[k] = renderer.domElement.toDataURL('image/png');
      sc.remove(g); disposeTree(g);
    }
  } catch (err) { console.warn('Vignettes indisponibles', err); }
  renderer.setPixelRatio(prevPR); renderer.setSize(prevSize.x, prevSize.y, false); renderer.toneMappingExposure = prevExp;
  if (thumbs) applyThumbs();
}
function applyThumbs() { $$('[data-thumb]').forEach((img) => { if (thumbs[img.dataset.thumb]) img.src = thumbs[img.dataset.thumb]; }); }

/* ---------------------------------------------------------------------------
   Boucle et démarrage
--------------------------------------------------------------------------- */
function rebuildAll() {
  buildRoom(); buildOpenings(); buildItems(); updateCotes(); renderPanels(); renderInspector(); updateVisibility();
}
function onResize() {
  const r = stageEl.getBoundingClientRect();
  const w = Math.max(1, r.width), h = Math.max(1, r.height);
  renderer.setSize(w, h, false); labelRenderer.setSize(w, h);
  persp.aspect = w / h; persp.updateProjectionMatrix();
  setOrthoFrustum();
  for (const m of coteMats) m.resolution.set(w, h);
}
const clock = new THREE.Clock();
function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
  stepTween(dt);
  if (ui.view === 'walk') walkUpdate(dt); else if (!viewTween) activeCtl()?.update();
  for (const op of doc.openings) {
    const o = openObjs.get(op.id); if (!o || o.type === 'window') continue;
    const target = op.open ? 1 : 0;
    if (Math.abs(o.f - target) > 1e-3) poseOpening(o, o.f + clamp(target - o.f, -dt / 2.2, dt / 2.2));
  }
  for (const [, o] of itemObjs) for (const tk of o.g.userData.ticks || []) tk(t);
  updateCutaway();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
}

function start() {
  try { initRenderer(); }
  catch (err) {
    const l = $('#loading'); l.classList.add('error');
    l.innerHTML = "La 3D n'a pas pu démarrer sur cet appareil.<br>Essaie avec un navigateur récent (Chrome, Firefox, Safari, Edge) et l'accélération matérielle activée.";
    console.error(err); return;
  }
  const el = renderer.domElement;
  el.addEventListener('pointerdown', onPointerDown, { capture: true });
  el.addEventListener('pointermove', onPointerMove);
  el.addEventListener('pointerup', onPointerUp);
  el.addEventListener('pointercancel', onPointerUp);
  el.addEventListener('contextmenu', (e) => e.preventDefault());
  makeControls();
  doc = loadSaved() || normalizeDoc(PRESETS.double());
  const legacy = !doc.migr.includes('r8drift');
  if (legacy) doc.migr.push('r8drift');
  bindUI();
  renderCatalog();
  rebuildAll();
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', (e) => { walk.keys[e.code] = false; });
  window.addEventListener('blur', () => { walk.keys = {}; });
  new ResizeObserver(() => { onResize(); if (!drag) setOrthoFrustum(); }).observe(stageEl);
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', updateBackground);
  new MutationObserver(updateBackground).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  ui.view = '';
  setView('iso');
  commit();
  if (legacy) {
    const n = migrateRackToR8();
    rebuildAll(); commit();
    if (n) setTimeout(() => toast("Power rack remplacé par l'Atletica R8 Drift · Ctrl+Z pour revenir"), 400);
  }
  onResize(); fitView();
  frame();
  makeThumbs();
  $('#loading').hidden = true;
}
start();
