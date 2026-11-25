// Matériaux et briques de modélisation (tubes, disques, barres, haltères).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { V3, DEG, UP, WALL_T, ISO_POLAR, STORE_KEY, SIDES, SIDE_NAME, SIDE_FROM, clamp, uid, cm, snap, esc, euro, num, cssVar } from './util.js';
import { rng, hashStr, makeCanvas, grain, blotches, drawBrick, drawConcreteWall, woodGrain, drawLambris, drawOSB, drawMetro, drawRibs, drawFoam, drawRubber, drawPuzzle, drawEpoxy, drawConcreteFloor, drawParquet, drawTurf, WALL_SURF, FLOOR_SURF, texCache, surfTex, swatchURL, canvasTexture, _grooveTex, grooveTex, screenTex, tvTex, turfTex } from './textures.js';

/* ---------------------------------------------------------------------------
   Matériaux et petites briques de modélisation
--------------------------------------------------------------------------- */
export let envTex = null;
export function setEnvTex(t) { envTex = t; }
export const matCache = new Map();
export function M(color, rough = 0.6, metal = 0, extra = null) {
  const key = color + '|' + rough + '|' + metal + '|' + (extra ? JSON.stringify(extra) : '');
  let m = matCache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, ...(extra || {}) });
    if (metal > 0.3) m.envMap = envTex;
    matCache.set(key, m);
  }
  return m;
}
export const CHROME = () => M('#d7dbe0', 0.18, 1);
export const DARK = () => M('#141517', 0.8, 0);
export function mesh(geo, mat, x = 0, y = 0, z = 0) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; return m; }
export function bx(w, h, d, mat, x, y, z) { return mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z); }
export function rb(w, h, d, r, mat, x, y, z) { return mesh(new RoundedBoxGeometry(w, h, d, 3, Math.min(r, h / 2 - 0.001, w / 2 - 0.001, d / 2 - 0.001)), mat, x, y, z); }
export function cy(r, len, mat, axis = 'y', x = 0, y = 0, z = 0, seg = 20, rTop = r) {
  const g = new THREE.CylinderGeometry(rTop, r, len, seg);
  if (axis === 'x') g.rotateZ(Math.PI / 2); else if (axis === 'z') g.rotateX(Math.PI / 2);
  return mesh(g, mat, x, y, z);
}
export function beam(a, b, r, mat, seg = 10) {
  const A = new V3(...a), B = new V3(...b), len = A.distanceTo(B);
  const m = mesh(new THREE.CylinderGeometry(r, r, len, seg), mat);
  m.position.copy(A).add(B).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(UP, B.clone().sub(A).normalize());
  return m;
}
export function slab(a, b, wid, thick, mat, rounded = 0) {
  const A = new V3(...a), B = new V3(...b), len = A.distanceTo(B);
  const m = rounded ? rb(wid, thick, len, rounded, mat) : bx(wid, thick, len, mat);
  m.position.copy(A).add(B).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new V3(0, 0, 1), B.clone().sub(A).normalize());
  return m;
}

export const PLATES = { 25: ['#d7262e', 0.225, 0.066], 20: ['#1f5fd1', 0.225, 0.056], 15: ['#f2b705', 0.225, 0.046], 10: ['#1f9d55', 0.225, 0.036], 5: ['#f1f1ef', 0.115, 0.03] };
export function plate(kg, axis = 'x') {
  const [c, r, t] = PLATES[kg];
  const g = new THREE.Group();
  g.add(cy(r, t, M(c, 0.55), axis, 0, 0, 0, 36));
  g.add(cy(0.032, t + 0.004, CHROME(), axis, 0, 0, 0, 16));
  return g;
}
export function barbell(plates = []) {
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
export function dumbbell(r) {
  const g = new THREE.Group(), len = 0.04 + r * 0.9, dk = M('#1a1b1d', 0.7);
  g.add(cy(0.016, 0.15, CHROME(), 'z', 0, 0, 0, 10));
  for (const s of [-1, 1]) g.add(cy(r, len, dk, 'z', 0, 0, s * (0.075 + len / 2), 6));
  return g;
}
export const KB = [[8, '#e85d9e'], [12, '#2f6fd6'], [16, '#f2b705'], [20, '#7b4bc4'], [24, '#1f9d55'], [28, '#f07f22'], [32, '#d7262e']];
export function kettlebell(kg, color) {
  const g = new THREE.Group(), s = 0.07 + (kg - 8) * 0.0022, m = M(color, 0.5);
  const ball = mesh(new THREE.SphereGeometry(s, 20, 14), m, 0, s * 0.95, 0); ball.scale.y = 0.95; g.add(ball);
  g.add(mesh(new THREE.TorusGeometry(s * 0.62, 0.016, 8, 20), M('#2a2b2e', 0.45, 0.4), 0, s * 1.7, 0));
  return g;
}
export function screenMesh(w, h) {
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), M('#000000', 0.4, 0, { emissive: '#ffffff', emissiveMap: screenTex(), emissiveIntensity: 1.2 }));
}
