// Objets annexes : silhouettes pour tester les mouvements, électricité, confort, sticker mural, équipement personnalisé.
import * as THREE from 'three';
import { V3 } from '../util.js';
import { makeCanvas } from '../textures.js';
import { M, CHROME, DARK, mesh, bx, rb, cy, beam, plate } from '../kit.js';

/* ---------- Silhouettes ----------
   Proportions d'après la stature H. `need(H)` : hauteur sous plafond nécessaire pour la position. */
export const POSES = {
  debout: { label: 'Debout', w: 0.55, d: 0.35, need: (H) => H + 0.1 },
  militaire: { label: 'Développé militaire', w: 2.2, d: 0.5, need: (H) => 1.19 * H + 0.225 + 0.05 },
  traction: { label: 'Traction', w: 1.2, d: 0.5, need: (H) => 1.345 * H + 0.05 },
  souleve: { label: 'Soulevé de terre', w: 2.2, d: 0.6, need: (H) => H + 0.1 },
};
export function personPoly(it) { return [[-it.w / 2, -it.d / 2], [it.w / 2, -it.d / 2], [it.w / 2, it.d / 2], [-it.w / 2, it.d / 2]]; }

function joints(H, pose) {
  const P = (x, y, z) => new V3(x * H, y * H, z * H);
  if (pose === 'souleve') {
    return { lift: 0, hip: [P(-0.055, 0.47, -0.12), P(0.055, 0.47, -0.12)], knee: [P(-0.07, 0.27, 0.05), P(0.07, 0.27, 0.05)], ankle: [P(-0.06, 0.04, 0), P(0.06, 0.04, 0)],
      sh: [P(-0.12, 0.68, 0.1), P(0.12, 0.68, 0.1)], el: [P(-0.15, 0.45, 0.06), P(0.15, 0.45, 0.06)], hand: [new V3(-0.17 * H, 0.225, 0.03 * H), new V3(0.17 * H, 0.225, 0.03 * H)],
      neck: P(0, 0.72, 0.15), head: P(0, 0.79, 0.2) };
  }
  const lift = pose === 'traction' ? 0.35 * H : 0;
  const j = { lift, hip: [P(-0.055, 0.53, 0), P(0.055, 0.53, 0)], knee: [P(-0.055, 0.285, 0.01), P(0.055, 0.285, 0.01)], ankle: [P(-0.06, 0.04, 0), P(0.06, 0.04, 0)],
    sh: [P(-0.13, 0.82, 0), P(0.13, 0.82, 0)], el: [P(-0.15, 0.64, 0), P(0.15, 0.64, 0)], hand: [P(-0.16, 0.45, 0.02), P(0.16, 0.45, 0.02)],
    neck: P(0, 0.87, 0), head: P(0, 0.935, 0.01) };
  if (pose === 'militaire') { j.el = [P(-0.22, 0.99, 0), P(0.22, 0.99, 0)]; j.hand = [P(-0.19, 1.19, 0), P(0.19, 1.19, 0)]; }
  if (pose === 'traction') {
    j.el = [P(-0.24, 0.86, 0.02), P(0.24, 0.86, 0.02)]; j.hand = [P(-0.2, 0.9, 0), P(0.2, 0.9, 0)];
    j.knee = [P(-0.055, 0.29, -0.06), P(0.055, 0.29, -0.06)]; j.ankle = [P(-0.06, 0.07, -0.02), P(0.06, 0.07, -0.02)];
  }
  if (lift) for (const k of Object.keys(j)) { const v = j[k]; if (Array.isArray(v)) v.forEach((p) => (p.y += lift)); else if (v instanceof V3) v.y += lift; }
  return j;
}
export function buildPerson(it) {
  const g = new THREE.Group(), H = it.h, pose = POSES[it.variant] ? it.variant : 'debout', m = M(it.color, 0.75), j = joints(H, pose);
  const limb = (a, b, r) => { g.add(beam(a.toArray(), b.toArray(), r, m, 10)); g.add(mesh(new THREE.SphereGeometry(r, 10, 8), m, b.x, b.y, b.z)); };
  for (const s of [0, 1]) {
    limb(j.hip[s], j.knee[s], 0.035 * H); limb(j.knee[s], j.ankle[s], 0.028 * H);
    g.add(rb(0.055 * H, 0.03 * H, 0.14 * H, 0.012, m, j.ankle[s].x, j.ankle[s].y - 0.012 * H, j.ankle[s].z + 0.035 * H));
    limb(j.sh[s], j.el[s], 0.026 * H); limb(j.el[s], j.hand[s], 0.022 * H);
  }
  const pelvis = j.hip[0].clone().add(j.hip[1]).multiplyScalar(0.5), chest = j.sh[0].clone().add(j.sh[1]).multiplyScalar(0.5);
  g.add(beam(pelvis.toArray(), chest.toArray(), 0.075 * H, m, 14));
  g.add(beam(j.sh[0].toArray(), j.sh[1].toArray(), 0.03 * H, m, 10));
  g.add(beam(j.hip[0].toArray(), j.hip[1].toArray(), 0.04 * H, m, 10));
  g.add(beam(chest.toArray(), j.neck.toArray(), 0.025 * H, m, 8));
  g.add(mesh(new THREE.SphereGeometry(0.062 * H, 18, 14), m, j.head.x, j.head.y, j.head.z));
  // accessoires de la position
  if (pose === 'militaire' || pose === 'souleve') {
    const y = j.hand[0].y, z = j.hand[0].z, ch = CHROME();
    g.add(cy(0.014, 1.31, ch, 'x', 0, y, z, 10));
    for (const sx of [-1, 1]) { g.add(cy(0.025, 0.42, ch, 'x', sx * 0.89, y, z, 12)); const p = plate(20); p.position.set(sx * 0.72, y, z); g.add(p); }
  }
  if (pose === 'traction') g.add(cy(0.016, 1.2, CHROME(), 'x', 0, j.hand[0].y + 0.02, 0, 12));
  // repère de la hauteur nécessaire
  const need = POSES[pose].need(H);
  const mark = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), new THREE.MeshBasicMaterial({ color: '#6b4fd1', transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false }));
  mark.material.userData.own = true; mark.rotation.x = -Math.PI / 2; mark.position.y = need; mark.userData.needMark = true; g.add(mark);
  return g;
}

/* ---------- Équipement personnalisé : un volume aux dimensions saisies, avec son nom sur le dessus ---------- */
function labelTexture(text, fg = '#ffffff', bg = null, w = 512, h = 128, font = '700 64px "Big Shoulders Display", "Arial Narrow", sans-serif') {
  const c = makeCanvas(w, h), x = c.getContext('2d');
  if (bg) { x.fillStyle = bg; x.fillRect(0, 0, w, h); }
  x.fillStyle = fg; x.textAlign = 'center'; x.textBaseline = 'middle';
  let size = parseInt(font.match(/(\d+)px/)[1], 10);
  x.font = font;
  while (x.measureText(text).width > w * 0.92 && size > 12) { size -= 4; x.font = font.replace(/\d+px/, size + 'px'); }
  x.fillText(text, w / 2, h / 2);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
export function buildCustom(it) {
  const g = new THREE.Group(), { w, d, h } = it;
  g.add(rb(w, h, d, Math.min(0.03, h / 2 - 0.001), M(it.color, 0.6, 0.1), 0, h / 2, 0));
  const t = labelTexture((it.label || 'Équipement').toUpperCase(), '#ffffff');
  const top = new THREE.Mesh(new THREE.PlaneGeometry(Math.max(0.2, w * 0.9), Math.max(0.05, Math.min(d * 0.9, w * 0.9 / 4))), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false }));
  top.material.userData.own = true; top.rotation.x = -Math.PI / 2; top.position.y = h + 0.002; g.add(top);
  return g;
}

/* ---------- Électricité et aération ---------- */
export function buildOutlet(it) {
  const g = new THREE.Group(), { w, d, h } = it;
  g.add(rb(w, h, d, 0.008, M(it.color, 0.4), 0, h / 2, 0));
  for (const dx of [-0.012, 0.012]) g.add(cy(0.004, 0.004, DARK(), 'z', dx, h / 2, d / 2, 8));
  return g;
}
export function buildSpot(it, ctx) {
  const g = new THREE.Group(), H = ctx.roomH;
  const panel = new THREE.Mesh(new THREE.BoxGeometry(it.w, 0.03, it.d), M('#ffffff', 0.4, 0, { emissive: '#fff6e8', emissiveIntensity: 2.2 }));
  panel.position.y = H - 0.02; g.add(panel);
  g.add(bx(it.w + 0.03, 0.012, it.d + 0.03, M(it.color, 0.5), 0, H - 0.006, 0));
  const l = new THREE.PointLight(0xfff1dc, 5, 0, 2); l.position.y = H - 0.15; g.add(l);
  return g;
}
export function buildExtractor(it) {
  const g = new THREE.Group(), { w, d, h } = it;
  g.add(rb(w, h, d, 0.01, M(it.color, 0.5), 0, h / 2, 0));
  for (let i = 1; i <= 5; i++) g.add(mesh(new THREE.TorusGeometry(w * 0.07 * i, 0.003, 4, 28), M('#9aa0a7', 0.5), 0, h / 2, d / 2 + 0.002));
  return g;
}
export function buildHeater(it) {
  const g = new THREE.Group(), { w, d, h } = it, m = M(it.color, 0.45, 0.2);
  const n = Math.max(5, Math.round(w / 0.07));
  for (let i = 0; i < n; i++) g.add(rb(w / n - 0.01, h - 0.1, d * 0.7, 0.015, m, -w / 2 + (i + 0.5) * w / n, h / 2 + 0.05, 0));
  for (const sx of [-1, 1]) g.add(bx(0.04, 0.06, d, DARK(), sx * w * 0.35, 0.03, 0));
  return g;
}
export function buildDehum(it) {
  const g = new THREE.Group(), { w, d, h } = it;
  g.add(rb(w, h, d, 0.03, M(it.color, 0.45), 0, h / 2, 0));
  g.add(bx(w * 0.7, h * 0.25, 0.004, M('#55595f', 0.6), 0, h * 0.7, d / 2 + 0.002));
  g.add(bx(w * 0.3, 0.03, 0.004, M('#2a8bd6', 0.4, 0, { emissive: '#2a8bd6', emissiveIntensity: 0.8 }), 0, h * 0.9, d / 2 + 0.002));
  return g;
}

/* ---------- Sticker / logo mural : texte personnalisable, couleur = couleur du texte ---------- */
export function buildDecal(it) {
  const g = new THREE.Group();
  const t = labelTexture(it.text || 'HOME GYM', it.color, null, 1024, Math.round(1024 * it.h / it.w), '800 300px "Big Shoulders Display", "Arial Narrow", sans-serif');
  const m = new THREE.Mesh(new THREE.PlaneGeometry(it.w, it.h), new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: 0.8, depthWrite: false }));
  m.material.userData.own = true; m.position.set(0, it.h / 2, it.d / 2 + 0.002); g.add(m);
  return g;
}
