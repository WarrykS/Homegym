// Modèles 3D génériques du catalogue. L'avant de chaque machine est vers +z local.
import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { V3, DEG, UP, WALL_T, ISO_POLAR, STORE_KEY, SIDES, SIDE_NAME, SIDE_FROM, clamp, uid, cm, snap, esc, euro, num, cssVar } from '../util.js';
import { rng, hashStr, makeCanvas, grain, blotches, drawBrick, drawConcreteWall, woodGrain, drawLambris, drawOSB, drawMetro, drawRibs, drawFoam, drawRubber, drawPuzzle, drawEpoxy, drawConcreteFloor, drawParquet, drawTurf, WALL_SURF, FLOOR_SURF, texCache, surfTex, swatchURL, canvasTexture, _grooveTex, grooveTex, screenTex, tvTex, turfTex } from '../textures.js';
import { envTex, matCache, M, CHROME, DARK, mesh, bx, rb, cy, beam, slab, PLATES, plate, barbell, dumbbell, KB, kettlebell, screenMesh } from '../kit.js';

export function buildRack(it) {
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
export function buildWallRack(it) {
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
export function buildBench(it) {
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
export function buildPlatform(it) {
  const g = new THREE.Group(), { w, d, h } = it;
  const cw = Math.min(1.22, w * 0.5), sw = (w - cw) / 2;
  const t = surfTex('floor', 'parquet').tex.clone(); t.needsUpdate = true; t.repeat.set(cw / 1.2, d / 1.2);
  const wood = new THREE.MeshStandardMaterial({ map: t, roughness: 0.6, color: '#f0dcc0' }); wood.userData.own = true;
  g.add(bx(cw, h, d, wood, 0, h / 2, 0));
  for (const s of [-1, 1]) g.add(bx(sw, h, d, M('#151618', 0.92), s * (cw / 2 + sw / 2), h / 2, 0));
  return g;
}
export function buildDumbbells(it) {
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
export function buildKettlebells(it) {
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
export function buildPlateTree(it) {
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
export function buildTreadmill(it) {
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
export function buildRower(it) {
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
export function buildBike(it) {
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
export function buildCable(it) {
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
export function buildLegpress(it) {
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
export function buildBag(it, ctx) {
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
export function buildMirror(it) {
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
export function buildTV(it) {
  const g = new THREE.Group(), { w, d, h } = it;
  g.add(bx(w, h, d, M('#0c0d0f', 0.35, 0.3), 0, h / 2, 0));
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.03, h - 0.03), M('#000000', 0.3, 0, { emissive: '#ffffff', emissiveMap: tvTex(), emissiveIntensity: 1.1 }));
  scr.position.set(0, h / 2, d / 2 + 0.001); g.add(scr);
  return g;
}
export function buildFan(it) {
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
export function buildPlant(it) {
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
export function buildPlyo(it) {
  const g = new THREE.Group(), { w, d, h } = it;
  g.add(rb(w, h, d, 0.012, M(it.color, 0.72), 0, h / 2, 0));
  for (const s of [-1, 1]) g.add(bx(0.006, 0.05, 0.18, M('#2a1c10', 0.9), s * (w / 2 + 0.002), h * 0.72, 0));
  return g;
}
export function buildTurf(it) {
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
export function buildMat(it) {
  const g = new THREE.Group(), { w, d, h } = it;
  g.add(rb(w, h, d, 0.004, M(it.color, 0.85), 0, h / 2, 0));
  return g;
}
export function buildShelf(it) {
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
export function buildFridge(it) {
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
