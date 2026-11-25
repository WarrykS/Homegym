// Modèles 3D Atletica, aux cotes du fabricant. L'avant de chaque machine est vers +z local.
import * as THREE from 'three';
import { V3, DEG, UP, WALL_T, ISO_POLAR, STORE_KEY, SIDES, SIDE_NAME, SIDE_FROM, clamp, uid, cm, snap, esc, euro, num, cssVar } from '../util.js';
import { rng, hashStr, makeCanvas, grain, blotches, drawBrick, drawConcreteWall, woodGrain, drawLambris, drawOSB, drawMetro, drawRibs, drawFoam, drawRubber, drawPuzzle, drawEpoxy, drawConcreteFloor, drawParquet, drawTurf, WALL_SURF, FLOOR_SURF, texCache, surfTex, swatchURL, canvasTexture, _grooveTex, grooveTex, screenTex, tvTex, turfTex } from '../textures.js';
import { envTex, matCache, M, CHROME, DARK, mesh, bx, rb, cy, beam, slab, PLATES, plate, barbell, dumbbell, KB, kettlebell, screenMesh } from '../kit.js';

// Atletica R8 Drift : cage 123 × 123 cm + section centrale ouverte de 108 cm + demi-tour à poulie de 30 cm.
// La tour est une colonne unique en bout de rack, avec un bras de tirage vertical en haut, une poulie réglable,
// et à sa base (côté cage) la charge : chariot à disques, ou pile de 95 kg pour la version PRO (it.variant = 'stack').
// Hauteur 226 cm, tubes 75 × 75 mm. Tour à droite (x+) sauf si it.flip.
export function buildR8Drift(it) {
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
export function buildBradley(it) {
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
export function buildDuality(it) {
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
export const EVO_EXT = 0.45;
export function buildPredator(it) {
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
export function buildOlyBar(it) {
  const g = new THREE.Group(), bb = barbell([]);
  bb.scale.x = it.w / 2.2; bb.position.y = 0.025; g.add(bb);
  return g;
}
// Barre EZ : 120 cm, poignée cintrée, manchons Ø 50 mm.
export function buildEZ(it) {
  const g = new THREE.Group(), ch = CHROME(), k = it.w / 1.2, y = 0.025;
  const pts = [[-0.32, 0], [-0.22, 0], [-0.17, 0.035], [-0.12, -0.035], [-0.06, 0], [0.06, 0], [0.12, -0.035], [0.17, 0.035], [0.22, 0], [0.32, 0]];
  for (let i = 0; i < pts.length - 1; i++) g.add(beam([pts[i][0] * k, y, pts[i][1]], [pts[i + 1][0] * k, y, pts[i + 1][1]], 0.014, ch, 10));
  for (const sx of [-1, 1]) { g.add(cy(0.027, 0.03, ch, 'x', sx * 0.335 * k, y, 0, 16)); g.add(cy(0.025, 0.25 * k, ch, 'x', sx * (0.35 + 0.125) * k, y, 0, 16)); }
  return g;
}
// Set de disques bumper noirs 110 kg (4 × 20, 2 × 10, 2 × 5 kg) rangés debout sur un support.
export function buildBumperSet(it) {
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
export function buildL1Pair(it) {
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
// Atletica R7 Cage 224 cm à charge libre : cage 4 montants 70 × 70 mm, 122 × 186 × 224 cm (pieds avant compris).
// À l'arrière au centre : colonne de charge avec poulie haute (tirage vertical) et chariot à disques en bas,
// cornes de chaque côté ; la même poulie sert au rameur assis, repose-pieds au pied de la colonne.
// Barre de traction multiprises, J-hooks, bras de sécurité de 47 cm, station à dips (avant) et landmine.
export function buildR7Cage(it) {
  const g = new THREE.Group(), { w, d, h } = it, fr = M(it.color, 0.45, 0.35), zinc = M('#a3a9b0', 0.35, 0.7), ch = CHROME(), dk = DARK(), p = 0.07;
  const white = M('#e9e9e6', 0.4), cable = M('#111214', 0.6);
  const rear = Math.min(0.3, d * 0.16), cage = Math.min(1.2, d - rear - 0.1);
  const zr = -d / 2 + rear + p / 2, zf = zr + cage - p, zc = -d / 2 + 0.09;
  const xs = [-w / 2 + p / 2, w / 2 - p / 2];
  for (const x of xs) {
    for (const z of [zr, zf]) g.add(bx(p, h, p, fr, x, h / 2, z));
    g.add(bx(p, p, cage, fr, x, h - p / 2, (zr + zf) / 2));
    // pied latéral prolongé vers l'avant, et vers l'arrière jusqu'à la colonne
    g.add(bx(p, 0.05, d, fr, x, 0.025, 0));
    g.add(bx(0.06, 0.11, 0.12, fr, x, 1.4, zf + 0.07));
    g.add(bx(0.06, 0.11, 0.12, fr, x, 1.15, zr + 0.07));
    // bras de sécurité : 47 cm devant les montants avant
    g.add(bx(0.06, 0.06, 0.47, zinc, x, 0.8, zf + p / 2 + 0.235));
  }
  for (const z of [zr, zf]) g.add(bx(w, p, p, fr, 0, h - p / 2, z));
  g.add(bx(w, 0.05, p, fr, 0, 0.025, zr));
  // barre de traction multiprises à l'avant
  for (const x of xs) g.add(bx(0.05, 0.05, 0.22, fr, x, h - 0.12, zf + 0.1));
  g.add(cy(0.016, w + 0.04, ch, 'x', 0, h - 0.12, zf + 0.2, 14));
  for (const k of [0.3, 0.7]) g.add(beam([-w / 2 + w * k, h - 0.12, zf + 0.2], [-w / 2 + w * k + (k < 0.5 ? -0.08 : 0.08), h - 0.24, zf + 0.34], 0.016, ch));
  // colonne de charge à l'arrière au centre
  g.add(bx(0.08, h - 0.05, 0.08, fr, 0, (h - 0.05) / 2, zc));
  g.add(bx(0.08, 0.08, zr - zc + p / 2, fr, 0, h - 0.04, (zr + zc) / 2));
  g.add(bx(w, 0.05, 0.08, fr, 0, 0.025, zc));
  // poulie haute et barre de tirage
  g.add(cy(0.05, 0.03, white, 'x', 0, h - 0.13, zc + 0.08, 18));
  g.add(cy(0.05, 0.03, white, 'x', 0, h - 0.13, zr + 0.25, 18));
  g.add(beam([0, h - 0.13, zc + 0.08], [0, h - 0.13, zr + 0.25], 0.004, cable, 4));
  g.add(cy(0.004, h - 0.13 - 1.85, cable, 'y', 0, (h - 0.13 + 1.85) / 2, zr + 0.25, 4));
  g.add(cy(0.016, 1.2, ch, 'x', 0, 1.82, zr + 0.25, 12));
  for (const sx of [-1, 1]) g.add(slab([sx * 0.6, 1.82, zr + 0.25], [sx * 0.66, 1.72, zr + 0.25], 0.035, 0.035, ch));
  // chariot à disques en bas, cornes de chaque côté
  g.add(bx(0.16, 0.24, 0.1, fr, 0, 0.32, zc + 0.09));
  g.add(cy(0.025, 0.56, ch, 'x', 0, 0.3, zc + 0.09, 12));
  for (const sx of [-1, 1]) for (let i = 0; i < 2; i++) { const pl = plate(i ? 10 : 20, 'x'); pl.position.set(sx * (0.13 + i * 0.05), 0.3, zc + 0.09); g.add(pl); }
  g.add(cy(0.004, h - 0.4, cable, 'y', 0, (h - 0.13 + 0.44) / 2, zc + 0.12, 4));
  // poulie basse et repose-pieds du rameur au pied de la colonne
  g.add(cy(0.045, 0.03, white, 'x', 0, 0.08, zr + 0.06, 18));
  const foot = bx(0.42, 0.025, 0.26, M('#2a2b2e', 0.6, 0.3), 0, 0.13, zr + 0.24); foot.rotation.x = -0.6; g.add(foot);
  g.add(bx(0.06, 0.06, 0.3, fr, 0, 0.03, zr + 0.18));
  // station à dips sur le montant avant droit, tournée vers l'avant
  const dx = xs[1], dz = zf + p / 2;
  g.add(bx(0.12, 0.16, 0.06, fr, dx, 1.2, dz + 0.03));
  for (const sx of [-1, 1]) g.add(slab([dx + sx * 0.2, 1.24, dz + 0.04], [dx + sx * 0.28, 1.24, dz + 0.5], 0.04, 0.04, fr));
  for (const sx of [-1, 1]) g.add(cy(0.022, 0.18, dk, 'z', dx + sx * 0.28, 1.25, dz + 0.42, 10));
  // landmine au pied du montant avant gauche
  g.add(bx(0.12, 0.12, 0.12, fr, xs[0], 0.08, dz + 0.06));
  g.add(cy(0.03, 0.2, ch, 'z', xs[0], 0.12, dz + 0.2, 12));
  return g;
}
// Atletica Harrier : station à poulie d'angle, 171 × 100,5 × 210,8 cm. Vue de dessus, un triangle :
// colonne centrale à la pointe arrière (deux piles de 90 kg de part et d'autre), deux bras à 45° vers les montants
// inox avant (poulies pivotantes, 21 positions), traverse avant avec barre de traction multiprises en avancée.
// Emprise au sol : hexagone qui suit la pointe, les piles et les montants (voir harrierPoly).
export function harrierPoly(it, pad = null) {
  const { w, d } = it, k = d / 1.005, kw = w / 1.71, fz = -d / 2 + 0.855 * k;
  if (!pad) return [[-0.06 * kw, -d / 2], [0.06 * kw, -d / 2], [0.37 * kw, -d / 2 + 0.06 * k], [w / 2, fz], [-w / 2, fz], [-0.37 * kw, -d / 2 + 0.06 * k]];
  const sx = pad.s || 0, f = pad.f || 0;
  return [[-0.06 * kw, -d / 2], [0.06 * kw, -d / 2], [0.37 * kw, -d / 2 + 0.06 * k], [w / 2 + sx, fz], [w / 2 + sx, fz + f], [-w / 2 - sx, fz + f], [-w / 2 - sx, fz], [-0.37 * kw, -d / 2 + 0.06 * k]];
}
export function buildHarrier(it) {
  const g = new THREE.Group(), { w, d, h } = it, fr = M(it.color, 0.45, 0.35), inox = M('#c9ccd1', 0.28, 0.85), ch = CHROME(), dk = DARK();
  const cable = M('#111214', 0.6), stack = M('#1b1c1f', 0.5, 0.4), label = M('#8e949b', 0.5, 0.3);
  const k = d / 1.005, top = h - 0.05, back = -d / 2, fz = back + 0.855 * k;
  const xo = w / 2 - 0.05, zo = fz - 0.04;                   // montants avant
  const ang = Math.atan2(xo, zo - back);                     // angle des bras par rapport à l'axe avant-arrière
  // colonne centrale à la pointe
  const zT = back + 0.1;
  g.add(bx(0.14, top, 0.14, fr, 0, top / 2, zT));
  g.add(bx(0.26, top - 0.25, 0.04, fr, 0, (top - 0.25) / 2 + 0.12, zT + 0.12));
  g.add(bx(0.17, 0.75, 0.005, label, 0, top - 0.55, zT + 0.143));
  // deux piles de part et d'autre, alignées sur les bras
  for (const sx of [-1, 1]) {
    const sg = new THREE.Group(); sg.position.set(sx * 0.27 * (w / 1.71), 0, back + 0.13 * k); sg.rotation.y = sx * (Math.PI / 2 - ang); g.add(sg);
    for (let i = 0; i < 18; i++) sg.add(bx(0.2, 0.024, 0.13, stack, 0, 0.1 + i * 0.026, 0));
    for (const dx of [-0.07, 0.07]) sg.add(cy(0.008, top - 0.2, ch, 'y', dx, (top - 0.2) / 2 + 0.08, 0, 8));
    sg.add(bx(0.24, 0.05, 0.16, fr, 0, 0.03, 0));
    sg.add(bx(0.24, 0.06, 0.16, fr, 0, top - 0.1, 0));
    sg.add(bx(0.2, 0.04, 0.14, fr, 0, 0.62, 0));
    sg.add(cy(0.004, top - 0.75, cable, 'y', 0, (top + 0.6) / 2, 0.03, 4));
  }
  for (const sx of [-1, 1]) {
    const x = sx * xo;
    // bras haut et piètement en V, de la colonne au montant
    g.add(slab([0, top - 0.04, zT], [x, top - 0.04, zo], 0.08, 0.08, fr));
    g.add(slab([sx * 0.08, top - 0.12, zT + 0.05], [x - sx * 0.06, top - 0.12, zo - 0.06], 0.05, 0.05, fr));
    g.add(slab([0, 0.04, zT], [x, 0.04, zo], 0.09, 0.08, fr));
    const foot = bx(0.11, 0.05, 0.42, fr, x, 0.025, zo); foot.rotation.y = -sx * (Math.PI / 2 - ang); g.add(foot);
    // montant inox avec perçages, poulie pivotante et poignée
    g.add(bx(0.07, top, 0.1, inox, x, top / 2, zo));
    for (let i = 0; i < 21; i++) g.add(bx(0.022, 0.022, 0.004, dk, x, 0.25 + i * 0.075, zo + 0.051));
    g.add(bx(0.1, 0.16, 0.12, dk, x - sx * 0.07, 1.45, zo + 0.02));
    g.add(cy(0.07, 0.05, dk, 'x', x - sx * 0.14, 1.42, zo + 0.06, 20));
    g.add(beam([x - sx * 0.17, 1.36, zo + 0.08], [x - sx * 0.19, 1.2, zo + 0.08], 0.004, cable, 4));
    g.add(mesh(new THREE.TorusGeometry(0.06, 0.012, 8, 18), dk, x - sx * 0.19, 1.13, zo + 0.08));
    g.add(cy(0.004, top - 1.5, cable, 'y', x - sx * 0.05, (top + 1.5) / 2, zo - 0.06, 4));
    g.add(beam([x - sx * 0.05, top - 0.13, zo - 0.06], [sx * 0.2, top - 0.13, back + 0.14], 0.004, cable, 4));
  }
  // traverse avant (logo) et barre de traction multiprises en avancée
  g.add(bx(2 * xo + 0.08, 0.08, 0.09, fr, 0, top - 0.04, zo));
  g.add(bx(0.24, 0.035, 0.004, label, 0, top - 0.04, zo + 0.047));
  for (const sx of [-1, 1]) {
    g.add(slab([sx * 0.2, top - 0.04, zo + 0.04], [sx * 0.2, top - 0.06, d / 2 - 0.06], 0.035, 0.035, dk, 0.012));
    g.add(slab([sx * 0.2, top - 0.06, d / 2 - 0.04], [sx * 0.6, top - 0.04, d / 2 - 0.08], 0.035, 0.035, dk, 0.012));
  }
  return g;
}
