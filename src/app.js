import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { V3, DEG, UP, WALL_T, ISO_POLAR, STORE_KEY, SIDES, SIDE_NAME, SIDE_FROM, $, $$, clamp, uid, cm, snap, esc, euro, num, cssVar } from './util.js';
import { rng, hashStr, makeCanvas, grain, blotches, drawBrick, drawConcreteWall, woodGrain, drawLambris, drawOSB, drawMetro, drawRibs, drawFoam, drawRubber, drawPuzzle, drawEpoxy, drawConcreteFloor, drawParquet, drawTurf, WALL_SURF, FLOOR_SURF, texCache, surfTex, swatchURL, canvasTexture, _grooveTex, grooveTex, screenTex, tvTex, turfTex } from './textures.js';
import { envTex, setEnvTex, matCache, M, CHROME, DARK, mesh, bx, rb, cy, beam, slab, PLATES, plate, barbell, dumbbell, KB, kettlebell, screenMesh } from './kit.js';
import { CATS, CATALOG, OPEN_DEF, POSES, EVO_EXT, variantOf, optOn, nameOf, priceOf, kgOf, urlOf, exercisesOf } from './catalog.js';

/* =========================================================================
   Home Gym Studio : implantation d'une salle de sport à la maison.
   Unités internes : mètres. Affichage : centimètres.
   Repère : x vers l'est, z vers le sud, y vers le haut. Le nord est en haut du plan.
   ========================================================================= */
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
      mkItem('r7cage', 0.4, -1.0, 0, { variant: '204', h: 2.04 }),
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
const ui = { view: 'iso', sel: null, isoAz: Math.PI / 4, elevSide: 'N', readonly: false };
const hist = { stack: [], idx: -1 };
const PLATE_KG = [25, 20, 15, 10, 5, 2.5, 1.25];

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
    floorType: d?.floorType === 'plancher' ? 'plancher' : 'dalle',
    plates: {}, session: [],
  };
  for (const kg of PLATE_KG) out.plates[kg] = clamp(Math.round(num(d?.plates?.[kg], 0)), 0, 99);
  for (const x of Array.isArray(d?.session) ? d.session.slice(0, 60) : []) {
    if (typeof x?.ex !== 'string') continue;
    out.session.push({ id: String(x.id || uid()), ex: x.ex.slice(0, 80), on: typeof x.on === 'string' ? x.on.slice(0, 80) : '', sets: clamp(Math.round(num(x.sets, 3)), 1, 20), reps: clamp(Math.round(num(x.reps, 10)), 1, 100), kg: clamp(num(x.kg, 0), 0, 500) });
  }
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
    out.items.push({ id: String(it.id || uid()), type: it.type, x: num(it.x, 0), z: num(it.z, 0), rot: num(it.rot, 0), w: clamp(num(it.w, def.w), 0.01, 8), d: clamp(num(it.d, def.d), 0.01, 8), h: clamp(num(it.h, def.h), 0.005, 4.4), elev: clamp(num(it.elev, def.elev || 0), 0, 4), color: /^#[0-9a-f]{6}$/i.test(it.color) ? it.color : def.color, ...(it.flip ? { flip: true } : {}), ...(it.evo ? { evo: true } : {}), ...(it.bought ? { bought: true } : {}),
      ...(def.variants?.some((v) => v.v === it.variant) ? { variant: it.variant } : {}),
      ...(it.opts && typeof it.opts === 'object' ? { opts: Object.fromEntries(Object.entries(it.opts).filter(([k]) => def.options?.some((o) => o.key === k)).map(([k, v]) => [k, !!v])) } : {}),
      ...(def.text ? { text: String(it.text ?? 'HOME GYM').slice(0, 40) } : {}),
      ...(def.custom ? { label: String(it.label || 'Équipement').slice(0, 60), price: clamp(num(it.price, 0), 0, 1e6), kg: clamp(num(it.kg, 0), 0, 5000), url: /^https:\/\//.test(it.url || '') ? String(it.url).slice(0, 500) : '' } : {}) });
  }
  return out;
}
function save() { if (ui.readonly) return; try { localStorage.setItem(STORE_KEY, JSON.stringify(doc)); } catch { /* stockage indisponible */ } }
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
  setEnvTex(pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture);

  persp = new THREE.PerspectiveCamera(50, 1, 0.03, 200);
  ortho = new THREE.OrthographicCamera(-5, 5, 5, -5, 0.1, 300);
  camera = ortho;

  scene.add(roomG, openG, itemsG, overG, coteG, outsideG, fixturesG);

  hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
  key = new THREE.DirectionalLight(0xffffff, 2);
  key.castShadow = true;
  key.shadow.mapSize.set(4096, 4096);
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
const activeCtl = () => (ui.view === 'plan' || ui.view === 'iso' || ui.view === 'elev' ? ctlO : ui.view === 'orbit' ? ctlP : null);

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
  const ortho = ui.view === 'plan' || ui.view === 'iso' || ui.view === 'elev';
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
    if (def.metal || (def.rough ?? 0.9) < 0.5) { m.envMap = envTex; m.envMapIntensity = def.metal ? 1 : 0.45; }
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
  const o = { g, over, zone: null, zoneLine: null, sel: null, tag: null, lifts: [] };
  g.traverse((m) => { if (m.userData.lift) o.lifts.push(m); });
  if (def.zone && def.poly) {
    const zp = def.poly(it, def.zone), col = new THREE.Color(CATS[def.cat].color);
    const shape = new THREE.Shape(zp.map(([x, z]) => new THREE.Vector2(x, -z)));
    const zg = new THREE.ShapeGeometry(shape); zg.rotateX(-Math.PI / 2);
    const zm = new THREE.Mesh(zg, new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.13, depthWrite: false, clippingPlanes: ROOM_CLIP }));
    zm.material.userData.own = true; zm.position.y = 0.006; over.add(zm);
    const ln = new THREE.Line(new THREE.BufferGeometry().setFromPoints([...zp, zp[0]].map(([x, z]) => new V3(x, 0.007, z))), new THREE.LineDashedMaterial({ color: col, dashSize: 0.1, gapSize: 0.06, transparent: true, opacity: 0.9, clippingPlanes: ROOM_CLIP }));
    ln.computeLineDistances(); ln.material.userData.own = true; over.add(ln);
    o.zone = zm; o.zoneLine = ln; o.zoneColor = col;
  } else if (def.zone) {
    const z = def.zone, zw = it.w + 2 * z.s, zd = it.d + z.f + z.b, zc = (z.f - z.b) / 2;
    const col = new THREE.Color(CATS[def.cat].color);
    const zm = new THREE.Mesh(new THREE.PlaneGeometry(zw, zd), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.13, depthWrite: false, clippingPlanes: ROOM_CLIP }));
    zm.material.userData.own = true; zm.rotation.x = -Math.PI / 2; zm.position.set(0, 0.006, zc); over.add(zm);
    const pts = [[-zw / 2, -zd / 2], [zw / 2, -zd / 2], [zw / 2, zd / 2], [-zw / 2, zd / 2], [-zw / 2, -zd / 2]].map(([x, y]) => new V3(x, 0.007, y + zc));
    const ln = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineDashedMaterial({ color: col, dashSize: 0.1, gapSize: 0.06, transparent: true, opacity: 0.9, clippingPlanes: ROOM_CLIP }));
    ln.computeLineDistances(); ln.material.userData.own = true; over.add(ln);
    o.zone = zm; o.zoneLine = ln; o.zoneColor = col;
  }
  const tagEl = document.createElement('div'); tagEl.className = 'name-tag'; tagEl.textContent = nameOf(it);
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
  o.g.position.set(it.x, def.hang || def.ceiling ? 0 : it.elev || 0, it.z);
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
  let geo;
  if (CATALOG[it.type].poly) {
    const pts = CATALOG[it.type].poly(it).map(([x, z]) => new THREE.Vector2(x, -z));
    const eg = new THREE.ExtrudeGeometry(new THREE.Shape(pts), { depth: y1 - y0 + 0.02, bevelEnabled: false });
    eg.rotateX(-Math.PI / 2); eg.translate(0, -(y1 - y0 + 0.02) / 2, 0);
    geo = new THREE.EdgesGeometry(eg); eg.dispose();
  } else geo = new THREE.EdgesGeometry(new THREE.BoxGeometry(it.w + 0.04, y1 - y0 + 0.02, it.d + 0.04));
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
  if (def.ceiling) return [doc.room.h - it.h, doc.room.h];
  const e = it.elev || 0; return [e, e + it.h];
}
function footprint(it, pad = null) {
  const th = -it.rot * DEG, c = Math.cos(th), s = Math.sin(th), def = CATALOG[it.type];
  if (def?.poly) return def.poly(it, pad).map(([lx, lz]) => [it.x + lx * c + lz * s, it.z - lx * s + lz * c]);
  const x0 = -it.w / 2 - (pad?.s || 0), x1 = it.w / 2 + (pad?.s || 0), z0 = -it.d / 2 - (pad?.b || 0), z1 = it.d / 2 + (pad?.f || 0);
  return [[x0, z0], [x1, z0], [x1, z1], [x0, z1]].map(([lx, lz]) => [it.x + lx * c + lz * s, it.z - lx * s + lz * c]);
}
// Décalages de l'emprise par rapport au centre, dans les axes de la pièce : { x0, x1, z0, z1 }.
function extents(it) {
  const pts = footprint({ ...it, x: 0, z: 0 });
  return { x0: Math.min(...pts.map((p) => p[0])), x1: Math.max(...pts.map((p) => p[0])), z0: Math.min(...pts.map((p) => p[1])), z1: Math.max(...pts.map((p) => p[1])) };
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
    if (def.person) {
      const pose = POSES[it.variant] ? it.variant : 'debout', need = POSES[pose].need(it.h);
      if (need > H + 0.001) add(it.id, `Il faut environ ${cm(need)} cm sous plafond pour ce mouvement (plafond à ${cm(H)} cm)`);
    }
    if (def.loadPad) {
      const lp = footprint(it, { s: def.loadPad.s || 0, b: def.loadPad.b || 0, f: 0 });
      if (lp.some(([x, z]) => Math.abs(x) > W / 2 + 0.006 || Math.abs(z) > D / 2 + 0.006)) add(it.id, `Moins de ${cm(def.loadPad.s || def.loadPad.b)} cm contre le mur : peu de place pour charger les disques`, 'soft');
    }
    const kg = kgOf(it), area = it.w * it.d;
    if (kg > 0 && area > 0.02 && !def.flat && !def.wall && !def.ceiling && !def.hang) {
      const dens = kg / area, lim = doc.floorType === 'plancher' ? 150 : 1500;
      if (dens > lim) add(it.id, `≈ ${Math.round(dens)} kg/m² au sol (hors disques)${doc.floorType === 'plancher' ? " : au-delà des 150 kg/m² d'un plancher d'habitation, fais vérifier" : ''}`, 'soft');
    }
  }
  const outlets = doc.items.filter((o) => CATALOG[o.type].outlet);
  const powered = doc.items.filter((o) => CATALOG[o.type].power);
  if (powered.length && !outlets.length) res.global.push({ msg: `${powered.length} appareil${powered.length > 1 ? 's' : ''} à brancher et aucune prise placée : ajoute-les depuis « Électricité et aération ».`, lvl: 'soft' });
  else for (const it of powered) {
    const r = Math.max(it.w, it.d) / 2 + 1.5;
    if (!outlets.some((o) => Math.hypot(o.x - it.x, o.z - it.z) <= r)) add(it.id, 'Pas de prise électrique à moins de 1,5 m', 'soft');
  }
  if (!doc.openings.some((o) => o.type === 'window') && !doc.items.some((o) => CATALOG[o.type].airflow)) res.global.push({ msg: "Pas de fenêtre ni d'aération : prévois un aérateur ou un déshumidificateur, surtout dans un garage ou un sous-sol.", lvl: 'soft' });
  if (doc.floorType === 'plancher') {
    const tot = doc.items.reduce((a, it) => a + kgOf(it), 0) + PLATE_KG.reduce((a, kg) => a + kg * (doc.plates[kg] || 0), 0);
    res.global.push({ msg: `Plancher : environ ${Math.round(tot)} kg d'équipement et de disques, soit ${Math.round(tot / (W * D))} kg/m² en moyenne. Au-delà de 150 kg/m² localement, demande l'avis d'un pro.`, lvl: 'soft' });
  }
  const list = doc.items;
  for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
    const a = list[i], b = list[j], da = CATALOG[a.type], db = CATALOG[b.type];
    if (da.flat || db.flat || da.noCollide || db.noCollide) continue;
    const [a0, a1] = vRange(a), [b0, b1] = vRange(b);
    if (a1 <= b0 + 0.005 || b1 <= a0 + 0.005) continue;
    if (polysOverlap(polys.get(a.id), polys.get(b.id))) { add(a.id, `Chevauche « ${nameOf(b)} »`); add(b.id, `Chevauche « ${nameOf(a)} »`); }
  }
  // la barre d'une silhouette (soulevé de terre, développé militaire) ne doit rien toucher
  for (const p of list) {
    if (!CATALOG[p.type].person || !['souleve', 'militaire'].includes(p.variant)) continue;
    for (const b of list) {
      const db = CATALOG[b.type]; if (b === p || db.flat || db.person || db.ceiling || db.outlet) continue;
      const [b0, b1] = vRange(b), y = p.variant === 'souleve' ? 0.225 : 1.19 * p.h;
      if (y < b0 - 0.25 || y > b1 + 0.25) continue;
      if (polysOverlap(polys.get(p.id), polys.get(b.id))) add(p.id, `La barre touche « ${nameOf(b)} »`, 'soft');
    }
  }
  for (const a of list) {
    const za = zones.get(a.id); if (!za) continue;
    for (const b of list) {
      if (a === b || CATALOG[b.type].flat || CATALOG[b.type].noCollide || CATALOG[b.type].zoneOk || res.items[b.id]?.some((m) => m.msg.includes(nameOf(a)))) continue;
      const [b0] = vRange(b); if (b0 > 1.2) continue;
      if (polysOverlap(za, polys.get(b.id))) add(b.id, `Empiète sur l'espace d'usage de « ${nameOf(a)} »`, 'soft');
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
  if (!drag) circ = computeCirculation();
  for (const id of circ.unreachable) add(id, 'Passage de moins de 80 cm pour y accéder depuis une porte', 'soft');
  return res;
}

/* Circulation : grille de 10 cm. Une personne (80 cm de large) peut-elle aller de chaque porte à chaque équipement ?
   Donne aussi la surface au sol restée libre (hors machines et espaces d'usage). */
let circ = { unreachable: new Set(), free: null };
function pointInPoly(x, z, P) {
  let inside = false;
  for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
    const [xi, zi] = P[i], [xj, zj] = P[j];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}
function distToPoly(x, z, P) {
  if (pointInPoly(x, z, P)) return 0;
  let best = Infinity;
  for (let i = 0; i < P.length; i++) {
    const [ax, az] = P[i], [bx2, bz] = P[(i + 1) % P.length], dx = bx2 - ax, dz = bz - az;
    const t = clamp(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1), 0, 1);
    best = Math.min(best, Math.hypot(x - ax - t * dx, z - az - t * dz));
  }
  return best;
}
function computeCirculation() {
  const { w: W, d: D } = doc.room, st = 0.1, nx = Math.max(1, Math.round(W / st)), nz = Math.max(1, Math.round(D / st)), R = 0.4;
  const solid = (it) => { const def = CATALOG[it.type]; if (def.flat || def.person || def.ceiling || def.outlet || def.lift || (def.wall && it.d < 0.1)) return false; return vRange(it)[0] < 1.0; };
  const obst = doc.items.filter(solid).map((it) => ({ it, P: footprint(it) }));
  const used = doc.items.filter((it) => !CATALOG[it.type].person && !CATALOG[it.type].ceiling && !CATALOG[it.type].outlet && vRange(it)[0] < 1.0)
    .flatMap((it) => [footprint(it), ...(CATALOG[it.type].zone ? [footprint(it, CATALOG[it.type].zone)] : [])]);
  const cx = (i) => -W / 2 + (i + 0.5) * st, cz = (j) => -D / 2 + (j + 0.5) * st;
  const blocked = new Uint8Array(nx * nz); let free = 0;
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const x = cx(i), z = cz(j);
    if (!used.some((P) => pointInPoly(x, z, P))) free++;
    if (x < -W / 2 + R - 0.02 || x > W / 2 - R + 0.02 || z < -D / 2 + R - 0.02 || z > D / 2 - R + 0.02 || obst.some((o) => distToPoly(x, z, o.P) < R - 0.02)) blocked[j * nx + i] = 1;
  }
  const out = { unreachable: new Set(), free: free * st * st };
  const doors = doc.openings.filter((o) => o.type !== 'window');
  if (!doors.length) return out;
  const seen = new Uint8Array(nx * nz), queue = [];
  for (const op of doors) {
    const info = wallInfo(op.wall);
    for (let u = op.pos + 0.1; u <= op.pos + op.w - 0.1; u += st) {
      const p = info.o.clone().addScaledVector(info.u, u).addScaledVector(info.n, R + 0.05);
      const i = clamp(Math.floor((p.x + W / 2) / st), 0, nx - 1), j = clamp(Math.floor((p.z + D / 2) / st), 0, nz - 1), k = j * nx + i;
      if (!blocked[k] && !seen[k]) { seen[k] = 1; queue.push(k); }
    }
  }
  for (let q = 0; q < queue.length; q++) {
    const k = queue[q], i = k % nx, j = (k / nx) | 0;
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= nx || b >= nz) continue;
      const n = b * nx + a; if (!blocked[n] && !seen[n]) { seen[n] = 1; queue.push(n); }
    }
  }
  for (const { it, P } of obst) {
    if (!CATALOG[it.type].zone) continue; // seuls les équipements avec un espace d'usage doivent être accessibles
    let ok = false;
    for (let j = 0; j < nz && !ok; j++) for (let i = 0; i < nx && !ok; i++) if (seen[j * nx + i] && distToPoly(cx(i), cz(j), P) < R + 0.3) ok = true;
    if (!ok) out.unreachable.add(it.id);
  }
  return out;
}
// Disques : ceux des sets placés dans la salle plus ceux saisis à la main.
function platesOwned() {
  const bumper = {}, iron = {};
  for (const kg of PLATE_KG) { bumper[kg] = doc.plates[kg] || 0; iron[kg] = 0; }
  for (const it of doc.items) {
    const def = CATALOG[it.type];
    for (const [kg, n] of Object.entries(def.plates || {})) bumper[kg] = (bumper[kg] || 0) + n;
    for (const [kg, n] of Object.entries(def.ironPlates || {})) iron[kg] = (iron[kg] || 0) + n;
  }
  return { bumper, iron };
}
function platesKg() { const p = platesOwned(); return PLATE_KG.reduce((a, kg) => a + kg * (p.bumper[kg] || 0), 0); }
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
    const it = sel, def = CATALOG[it.type], e = extents(it), yy = 0.03;
    const L = it.x + e.x0 + W / 2, R = W / 2 - it.x - e.x1, N = it.z + e.z0 + D / 2, S = D / 2 - it.z - e.z1;
    const zero = new V3();
    if (L > 0.01) dim(new V3(-W / 2, yy, it.z), new V3(it.x + e.x0, yy, it.z), zero, L, (v) => moveItem(it, { x: -W / 2 + v - e.x0 }), 'sub');
    if (R > 0.01) dim(new V3(it.x + e.x1, yy, it.z), new V3(W / 2, yy, it.z), zero, R, (v) => moveItem(it, { x: W / 2 - v - e.x1 }), 'sub');
    if (N > 0.01) dim(new V3(it.x, yy, -D / 2), new V3(it.x, yy, it.z + e.z0), zero, N, (v) => moveItem(it, { z: -D / 2 + v - e.z0 }), 'sub');
    if (S > 0.01) dim(new V3(it.x, yy, it.z + e.z1), new V3(it.x, yy, D / 2), zero, S, (v) => moveItem(it, { z: D / 2 - v - e.z1 }), 'sub');
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
  const e = extents(it);
  it.x = e.x1 - e.x0 > W ? 0 : clamp(it.x, -W / 2 - e.x0, W / 2 - e.x1);
  it.z = e.z1 - e.z0 > D ? 0 : clamp(it.z, -D / 2 - e.z0, D / 2 - e.z1);
}
// Pour une machine d'angle : si elle est près d'un coin, l'orienter pointe vers le coin et l'y caler.
function snapToCorner(it, x, z, reach = 1.1) {
  const { w: W, d: D } = doc.room;
  const sx = x < 0 ? -1 : 1, sz = z < 0 ? -1 : 1;
  if (Math.hypot(x - sx * W / 2, z - sz * D / 2) > reach + Math.max(it.w, it.d) / 2) return false;
  it.rot = normRot(-Math.atan2(-sx, -sz) / DEG);
  it.x = sx * W; it.z = sz * D; clampItem(it);
  return true;
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
  for (const k of ['w', 'd', 'h']) if (p[k] != null) it[k] = clamp(p[k], (k === 'h' && def.flat) || (k === 'd' && def.wall) ? 0.005 : 0.05, 8);
  if (p.elev != null) it.elev = clamp(p.elev, 0, doc.room.h - it.h);
  if (p.rot != null) it.rot = ((Math.round(p.rot) % 360) + 360) % 360;
  if (p.color) it.color = p.color;
  if (def.wall) snapToWall(it, it.x, it.z, true); else clampItem(it);
  rebuildItem(it); updateCotes();
}
function applyVariant(it, v) {
  const def = CATALOG[it.type], x = def.variants?.find((q) => q.v === v); if (!x) return;
  it.variant = v;
  for (const k of ['w', 'd', 'h']) if (x[k] != null) it[k] = x[k];
  if (def.wall) snapToWall(it, it.x, it.z, true); else clampItem(it);
  rebuildItem(it); showSelBox(); updateCotes(); commit(); renderInspector(); renderLists();
}
// Une barre lâchée dans un rack se pose sur ses J-hooks ; sortie d'un rack, elle revient au sol.
function snapToHooks(it) {
  for (const r of doc.items) {
    const rd = CATALOG[r.type]; if (!rd.hooks || r === it) continue;
    if (!pointInPoly(it.x, it.z, footprint(r, { f: 0.3, b: 0, s: 0 }))) continue;
    const h = rd.hooks(r), th = -r.rot * DEG, c = Math.cos(th), sn = Math.sin(th);
    it.x = r.x + h.x * c + h.z * sn; it.z = r.z - h.x * sn + h.z * c; it.rot = r.rot; it.elev = h.y - 0.025;
    return r;
  }
  if (it.elev > 0.3) it.elev = 0;
  return null;
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
  const others = doc.items.filter((o) => o !== it && !CATALOG[o.type].flat && !CATALOG[o.type].ceiling && !CATALOG[o.type].outlet).map((o) => footprint(o, CATALOG[o.type].zone ? { f: 0.1, b: 0.1, s: 0.1 } : null));
  for (const [x, z] of cands) {
    it.x = x; it.z = z; clampItem(it);
    const fp = footprint(it, { f: 0.1, b: 0.1, s: 0.1 });
    if (CATALOG[it.type].flat || CATALOG[it.type].ceiling || !others.some((o) => polysOverlap(o, fp))) return;
  }
  it.x = 0; it.z = 0; clampItem(it);
}
function findCorner(it) {
  const { w: W, d: D } = doc.room;
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    snapToCorner(it, sx * W / 2, sz * D / 2);
    const fp = footprint(it, CATALOG[it.type].zone);
    if (!doc.items.some((o) => !CATALOG[o.type].flat && polysOverlap(footprint(o), fp)) && !doc.openings.some((op) => polysOverlap(wallRect(op, op.type === 'door' ? op.w : 0.3), fp))) return;
  }
  findFreeSpot(it);
}
function addItem(type, at = null, extra = {}) {
  const it = mkItem(type, 0, 0, 0, extra);
  if (at) { it.x = at.x; it.z = at.z; if (CATALOG[type].wall) snapToWall(it, at.x, at.z); else clampItem(it); }
  else if (CATALOG[type].wall) { snapToWall(it, 0, -doc.room.d / 2); findWallSpot(it); }
  else if (CATALOG[type].corner) findCorner(it);
  else findFreeSpot(it);
  doc.items.push(it);
  addItemObj(it); refreshAnalysis();
  select({ kind: 'item', id: it.id });
  commit(); renderPanels();
  toast(`${nameOf(it)} ajouté`);
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
    const it = { ...s, id: uid(), ...(s.opts ? { opts: { ...s.opts } } : {}) };
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
  } else if (ui.view === 'elev') {
    const info = wallInfo(ui.elevSide), c = info.o.clone().addScaledVector(info.u, info.L / 2).setY(h / 2);
    orthoVS = Math.max(h / 2 + 0.7, (info.L / 2 + 0.8) / a);
    const az = Math.atan2(info.n.x, info.n.z);
    ctlO.minAzimuthAngle = ctlO.maxAzimuthAngle = az; ctlO.minPolarAngle = ctlO.maxPolarAngle = Math.PI / 2;
    ctlO.target.copy(c); ortho.position.copy(c).addScaledVector(info.n, 60); ortho.zoom = 1; setOrthoFrustum(); ctlO.update();
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
  if (v === 'plan' || v === 'iso' || v === 'elev') {
    camera = ortho; ctlO.enabled = true;
    if (v === 'elev') {
      ctlO.enableRotate = false;
      ctlO.mouseButtons = { LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };
      ctlO.touches = { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_PAN };
    } else if (v === 'plan') {
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
  $('#btnRotL').hidden = $('#btnRotR').hidden = v === 'plan' || v === 'elev';
  $('#elevSides').hidden = v !== 'elev';
  $$('#elevSides button').forEach((b) => b.classList.toggle('on', b.dataset.side === ui.elevSide));
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
    if (v === 'elev') want = s === { N: 'S', S: 'N', E: 'W', W: 'E' }[ui.elevSide];
    else if ((v === 'iso' || v === 'orbit') && doc.wallMode !== 'full') {
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
    if (def.wall) snapToWall(it, x, z); else if (!(def.corner && !e.altKey && snapToCorner(it, x, z, 0.6))) { it.x = x; it.z = z; clampItem(it); }
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
    if (drag.moved && drag.kind === 'item' && CATALOG[drag.it.type].lift) {
      const was = drag.it.elev, r = snapToHooks(drag.it);
      placeItemObj(drag.it); showSelBox(); refreshAnalysis(); updateCotes();
      if (r) toast(`Barre posée sur les J-hooks : ${nameOf(r)}`); else if (was > 0.3) toast('Barre posée au sol');
    }
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
  if (['1', '2', '3', '4', '5'].includes(k)) { setView(['plan', 'iso', 'orbit', 'walk', 'elev'][+k - 1]); return; }
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
  $('#floorType').value = doc.floorType;
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
  il.innerHTML = doc.items.length ? doc.items.map((it) => `<li data-item="${it.id}" class="${ui.sel?.id === it.id ? 'on' : ''}"><span class="dot" style="background:${CATS[CATALOG[it.type].cat].color}"></span><span class="name">${esc(nameOf(it))}</span>${analysis.bad.has(it.id) ? '<span class="warn-dot" title="À vérifier"></span>' : ''}<span class="meta">${cm(it.w)}×${cm(it.d)}</span></li>`).join('')
    : '<li class="empty">Ta salle est vide : pioche dans le catalogue.</li>';
}
function renderCatalog() {
  const byCat = {};
  for (const [k, d] of Object.entries(CATALOG)) if (!d.hidden) (byCat[d.cat] ||= []).push([k, d]);
  $('#catalog').innerHTML = Object.entries(CATS).map(([ck, c]) => `<div class="cat"><h4><i style="background:${c.color}"></i>${esc(c.label)}</h4><div class="cards">${(byCat[ck] || []).map(([k, d]) => `
    <button type="button" class="card" data-type="${k}" draggable="true" title="Ajouter : ${esc(d.name)}"><div class="thumb"><img alt="" data-thumb="${k}"></div><b>${esc(d.name)}</b><small>${cm(d.w)} × ${cm(d.d)} × ${cm(d.h)} cm${d.noBudget ? '' : ' · ' + euro(d.price)}</small></button>`).join('')}${ck === 'gabarit' ? `
    <button type="button" class="card card-new" id="btnCustom"><div class="thumb"><span>+</span></div><b>Créer un équipement</b><small>Nom, dimensions, prix et lien de ton choix</small></button>` : ''}</div></div>`).join('');
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
    ${s.free != null ? `<dt>Surface libre (hors machines et espaces d'usage)</dt><dd>${s.free.toFixed(1).replace('.', ',')} m²</dd>` : ''}
    <dt>Poids de l'équipement</dt><dd>≈ ${Math.round(s.kg)} kg</dd>
    <dt>Ouvertures</dt><dd>${doc.openings.length}</dd>`;
  renderVersions();
  const checks = [...analysis.global];
  for (const it of doc.items) for (const w of analysis.items[it.id] || []) checks.push({ msg: `${nameOf(it)} : ${w.msg}`, lvl: w.lvl });
  $('#checkList').innerHTML = checks.length ? checks.map((c) => `<li class="${c.lvl === 'bad' ? 'bad' : ''}">${esc(c.msg)}</li>`).join('') : '<li class="good">Tout est en ordre : pas de chevauchement, ça passe sous le plafond.</li>';
}
function stats() {
  const { w, d, h } = doc.room;
  let budget = 0, bought = 0, foot = 0, kg = 0;
  for (const it of doc.items) {
    const def = CATALOG[it.type], p = def.noBudget ? 0 : priceOf(it);
    budget += p; if (it.bought) bought += p; kg += kgOf(it);
    if (!def.flat && !def.wall && !def.hang && !def.ceiling && !def.person) foot += it.w * it.d;
  }
  kg += PLATE_KG.reduce((a, k) => a + k * (doc.plates[k] || 0), 0);
  return { area: w * d, vol: w * d * h, budget, bought, kg, free: circ.free, occ: Math.round((foot / (w * d)) * 100) };
}
function renderStatus() {
  const s = stats(), nWarn = analysis.bad.size + analysis.global.filter((g) => g.lvl === 'bad').length;
  $('#status').innerHTML = `<span class="chip"><b>${s.area.toFixed(1).replace('.', ',')}</b> m²</span><span class="chip">${doc.items.length} équip.</span><span class="chip">≈ <b>${euro(s.budget)}</b></span>`
    + (nWarn ? `<button type="button" class="chip warn" id="chipWarn">${nWarn} point${nWarn > 1 ? 's' : ''} à vérifier</button>` : '<span class="chip okc opt">Tout passe</span>')
    + '<span class="chip opt">Cotes en cm</span>';
  if ($('#chipWarn')) $('#chipWarn').onclick = () => { switchTab('project'); renderProject(); };
  renderProject();
  renderListsWarn();
  if (!drag) renderShop();
}
function renderListsWarn() { if (!drag) renderLists(); }
function renderPanels() { renderRoomPanel(); renderWallCards(); renderLists(); renderProject(); renderShop(); renderSession(); }

function renderInspector() {
  const el = $('#inspector'), s = findSel();
  if (!s || ui.view === 'walk') { el.hidden = true; el.innerHTML = ''; return; }
  el.hidden = false;
  if (ui.sel.kind === 'item') {
    const def = CATALOG[s.type], cat = CATS[def.cat], warns = analysis.items[s.id] || [], v = variantOf(s), url = urlOf(s), kg = kgOf(s), ex = exercisesOf(s);
    const sub = def.person ? `Gabarit · taille ${cm(s.h)} cm` : `${esc(cat.label)}${def.noBudget ? '' : ' · env. ' + euro(priceOf(s))}${kg ? ' · ' + Math.round(kg) + ' kg' : ''}`;
    const hLabel = def.person ? 'Taille' : 'Hauteur';
    el.innerHTML = `
      <div class="insp-head"><span class="dot" style="background:${cat.color}"></span><h2>${esc(nameOf(s))}<small>${sub}</small></h2>
        <button type="button" class="icon-btn" data-act="close" aria-label="Fermer"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>
      ${def.custom ? `<div class="insp-grid two"><label>Nom<input type="text" data-c="label" value="${esc(s.label)}" maxlength="60"></label><label>Prix (€)<input type="number" data-c="price" value="${s.price}" min="0" step="1"></label></div>
        <div class="insp-grid two"><label>Poids (kg)<input type="number" data-c="kg" value="${s.kg}" min="0" step="1"></label><label>Lien (https://)<input type="text" data-c="url" value="${esc(s.url || '')}" placeholder="https://"></label></div>` : ''}
      ${def.variants ? `<span class="lbl-sm">${def.person ? 'Position' : 'Version'}</span><div class="seg seg-v" style="grid-template-columns:repeat(${Math.min(def.variants.length, 2)},1fr)">${def.variants.map((x) => `<button type="button" data-act="variant" data-v="${x.v}" class="${x.v === v.v ? 'on' : ''}">${esc(x.label)}</button>`).join('')}</div>` : ''}
      <div class="insp-grid">
        <label>Largeur<input type="number" data-f="w" value="${cm(s.w)}" min="5" step="1"></label>
        <label>Profondeur<input type="number" data-f="d" value="${cm(s.d)}" min="${def.flat ? 1 : 1}" step="1"></label>
        <label>${hLabel}<input type="number" data-f="h" value="${cm(s.h)}" min="1" step="1"></label>
      </div>
      ${def.text ? `<div class="insp-grid two"><label>Texte<input type="text" data-c="text" value="${esc(s.text)}" maxlength="40"></label><label>Couleur<input type="color" data-f="color" value="${s.color}"></label></div>` : ''}
      ${def.wall && def.elev != null ? `<div class="insp-grid two"><label>Fixé à (cm du sol)<input type="number" data-f="elev" value="${cm(s.elev)}" min="0" step="1"></label><label>Mur<input type="text" value="${esc(SIDE_NAME[ROT_SIDE[normRot(s.rot)] || 'N'])}" disabled></label></div>` : def.wall || def.ceiling ? '' : `
      <span class="lbl-sm">Rotation</span>
      <div class="rot-row">
        <button type="button" class="btn" data-rot="-90" title="Maj+R : 15°">−90°</button><button type="button" class="btn" data-rot="-15">−15°</button>
        <button type="button" class="btn" data-rot="15">+15°</button><button type="button" class="btn" data-rot="90" title="Touche R">+90°</button></div>
      <div class="insp-grid two"><label>Angle (°)<input type="number" data-f="rot" value="${Math.round(s.rot)}" step="1"></label><label>Couleur<input type="color" data-f="color" value="${s.color}"></label></div>`}
      ${(def.wall && !def.text) || def.ceiling ? `<div class="insp-row"><span class="lbl">Couleur</span><input type="color" data-f="color" value="${s.color}"></div>` : ''}
      ${def.options ? `<div class="opt-list">${def.options.map((o) => `<label><input type="checkbox" data-opt="${o.key}"${optOn(s, o.key) ? ' checked' : ''}> ${esc(o.label)}${o.price ? ` <small>+${euro(o.price)}</small>` : ''}</label>`).join('')}</div>` : ''}
      ${def.evo ? `<button type="button" class="btn" data-act="evo">${s.evo ? "Retirer l'EVO Arm (−199 €)" : "Monter l'EVO Arm (+199 €)"}</button>` : ''}
      ${def.lift ? `<div class="insp-grid two"><label>Posée à (cm du sol)<input type="number" data-f="elev" value="${cm(s.elev)}" min="0" step="1"></label></div><p class="hint">Glisse la barre dans un rack : elle se pose toute seule sur les J-hooks.</p>` : ''}
      ${def.flip ? `<button type="button" class="btn" data-act="flip">Mettre la tour à ${s.flip ? 'droite' : 'gauche'}</button>` : ''}
      ${warns.length ? `<ul class="warns">${warns.map((w) => `<li class="${w.lvl === 'soft' ? 'soft' : ''}">${esc(w.msg)}</li>`).join('')}</ul>` : '<p class="goodnote">Bien placé, rien à signaler.</p>'}
      ${ex.length ? `<details class="ex-box"><summary>Exercices possibles (${ex.length})</summary><div class="ex-chips">${ex.map((x) => `<button type="button" class="chip-btn" data-ex="${esc(x)}" title="Ajouter à ma séance">+ ${esc(x)}</button>`).join('')}</div></details>` : ''}
      <div class="insp-links">${url ? `<a href="${esc(url)}" target="_blank" rel="noopener">Voir la fiche produit ↗</a>` : ''}${def.noBudget ? '' : `<label class="bought"><input type="checkbox" data-act="bought"${s.bought ? ' checked' : ''}> Déjà acheté</label>`}</div>
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
  $$('.tabs button').forEach((b) => b.addEventListener('click', () => { switchTab(b.dataset.tab); if (b.dataset.tab === 'project') renderProject(); if (b.dataset.tab === 'shop') renderShop(); }));
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
    const exb = e.target.closest('[data-ex]');
    if (exb) { addToSession(exb.dataset.ex, nameOf(findSel())); return; }
    const b = e.target.closest('[data-act],[data-rot]'); if (!b || b.type === 'checkbox') return;
    if (b.dataset.rot) { rotateSel(+b.dataset.rot); return; }
    const a = b.dataset.act, s = findSel();
    if (a === 'close') select(null);
    if (a === 'dup') duplicateSel();
    if (a === 'del') deleteSel();
    if (a === 'toggle') toggleOpening(s);
    if (a === 'variant') applyVariant(s, b.dataset.v);
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
    const t = e.target;
    if (t.dataset.opt) { s.opts = { ...(s.opts || {}), [t.dataset.opt]: t.checked }; rebuildItem(s); showSelBox(); commit(); renderInspector(); renderLists(); return; }
    if (t.dataset.act === 'bought') { if (t.checked) s.bought = true; else delete s.bought; commit(); renderShop(); return; }
    if (t.dataset.c) {
      const c = t.dataset.c;
      if (c === 'price' || c === 'kg') s[c] = clamp(num(t.value, 0), 0, c === 'price' ? 1e6 : 5000);
      else if (c === 'url') { if (t.value && !t.value.startsWith('https://')) { toast('Le lien doit commencer par https://'); return; } s.url = t.value.slice(0, 500); }
      else s[c] = t.value.slice(0, c === 'text' ? 40 : 60);
      rebuildItem(s); showSelBox(); commit(); renderInspector(); renderLists(); return;
    }
    const f = t.dataset.f, o = t.dataset.o;
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

  $('#floorType').addEventListener('change', (e) => { doc.floorType = e.target.value; refreshAnalysis(); commit(); });
  $('#catalog').addEventListener('click', (e) => { if (e.target.closest('#btnCustom')) { e.stopPropagation(); customDialog(); } }, true);
  $('#shopList').addEventListener('change', (e) => {
    const id = e.target.dataset.buy; if (!id) return;
    const it = doc.items.find((i) => i.id === id); if (!it) return;
    if (e.target.checked) it.bought = true; else delete it.bought;
    commit(); renderShop(); renderInspector();
  });
  $('#plateTable').addEventListener('change', (e) => {
    const kg = e.target.dataset.plate; if (!kg) return;
    doc.plates[kg] = clamp(Math.round(num(e.target.value, 0)), 0, 99); commit(); renderShop(); refreshAnalysis();
  });
  $('#btnShopCSV').addEventListener('click', () => saveFile(`${slug()}-achats.csv`, '\ufeff' + shopCSV(), 'text/csv'));
  $('#btnShopCopy').addEventListener('click', async () => { try { await navigator.clipboard.writeText(shopCSV().replace(/;/g, '\t').replace(/"/g, '')); toast('Liste copiée : colle-la dans un tableur'); } catch { toast('Copie impossible ici : télécharge plutôt le fichier'); } });
  $('#sessionList').addEventListener('change', (e) => {
    const li = e.target.closest('[data-sid]'), f = e.target.dataset.sf; if (!li || !f) return;
    const x = doc.session.find((q) => q.id === li.dataset.sid); if (!x) return;
    x[f] = clamp(num(e.target.value, x[f]), f === 'kg' ? 0 : 1, f === 'kg' ? 500 : f === 'sets' ? 20 : 100); commit();
  });
  $('#sessionList').addEventListener('click', (e) => {
    if (!e.target.closest('[data-sdel]')) return;
    const li = e.target.closest('[data-sid]'); doc.session = doc.session.filter((q) => q.id !== li.dataset.sid); commit(); renderSession();
  });
  $('#sessionForm').addEventListener('submit', (e) => { e.preventDefault(); const v = $('#sessionEx').value.trim(); if (v) { addToSession(v.slice(0, 80), ''); $('#sessionEx').value = ''; } });
  $('#btnSessionCopy').addEventListener('click', async () => { try { await navigator.clipboard.writeText(sessionText()); toast('Séance copiée'); } catch { toast('Copie impossible ici : télécharge plutôt le fichier'); } });
  $('#btnSessionDl').addEventListener('click', () => saveFile(`${slug()}-seance.txt`, sessionText(), 'text/plain'));
  $('#btnSessionClear').addEventListener('click', () => { if (!doc.session.length) return; doc.session = []; commit(); renderSession(); toast('Séance vidée · Ctrl+Z pour annuler'); });
  $('#btnVersionSave').addEventListener('click', () => {
    const name = ($('#versionName').value.trim() || `Version du ${new Date().toLocaleDateString('fr-FR')}`).slice(0, 60);
    const vs = loadVersions(); vs.unshift({ id: uid(), name, date: Date.now(), doc: JSON.parse(JSON.stringify(doc)) });
    if (storeVersions(vs.slice(0, 20))) { $('#versionName').value = ''; renderVersions(); toast(`Version « ${name} » enregistrée`); }
  });
  $('#versionList').addEventListener('click', (e) => {
    const li = e.target.closest('[data-vid]'); if (!li) return;
    const vs = loadVersions(), v = vs.find((q) => q.id === li.dataset.vid); if (!v) return;
    if (e.target.closest('[data-vload]')) loadDoc(v.doc, `Version « ${v.name} » ouverte · Ctrl+Z pour revenir`);
    if (e.target.closest('[data-vdel]')) { storeVersions(vs.filter((q) => q !== v)); renderVersions(); toast('Version supprimée'); }
  });
  $('#btnShare').addEventListener('click', shareLink);
  $('#btnPrint').addEventListener('click', printSheet);
  $('#roCopy').addEventListener('click', () => { setReadonly(false); save(); history.replaceState(null, '', location.pathname + location.search); toast('Plan copié dans ton projet'); });
  $$('#elevSides button').forEach((b) => b.addEventListener('click', () => { ui.elevSide = b.dataset.side; $$('#elevSides button').forEach((x) => x.classList.toggle('on', x === b)); for (const s2 of SIDES) if (cutState[s2]) { cutState[s2] = false; buildWall(s2); } fitView(); updateVisibility(); }));
  $('#btnPanel').addEventListener('click', () => { const on = document.body.classList.toggle('panel-min'); $('#btnPanel').setAttribute('aria-pressed', String(on)); setTimeout(() => { onResize(); fitView(); }, 60); });
  $$('.tabs button').forEach((b) => b.addEventListener('click', () => { if (document.body.classList.contains('panel-min')) { document.body.classList.remove('panel-min'); $('#btnPanel').setAttribute('aria-pressed', 'false'); setTimeout(onResize, 50); } }));
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
   Liste d'achats, disques, séance, versions
--------------------------------------------------------------------------- */
function renderShop() {
  const el = $('#shopList'); if (!el) return;
  const rows = doc.items.filter((it) => !CATALOG[it.type].noBudget);
  const s = stats();
  el.innerHTML = rows.length ? rows.map((it) => {
    const url = urlOf(it);
    return `<li class="${it.bought ? 'done' : ''}"><label><input type="checkbox" data-buy="${it.id}"${it.bought ? ' checked' : ''}><span class="name">${esc(nameOf(it))}</span></label>
      <span class="meta">${euro(priceOf(it))}</span>${url ? `<a href="${esc(url)}" target="_blank" rel="noopener" title="Fiche produit">↗</a>` : '<span class="nolink"></span>'}</li>`;
  }).join('') : '<li class="empty">Ajoute des équipements dans ta salle : ils apparaîtront ici.</li>';
  $('#shopTotals').innerHTML = `<dt>Total</dt><dd class="big">${euro(s.budget)}</dd><dt>Déjà acheté</dt><dd>${euro(s.bought)}</dd><dt>Reste à acheter</dt><dd><b>${euro(s.budget - s.bought)}</b></dd>`;
  const pl = platesOwned();
  $('#plateTable').innerHTML = `<tr><th>Disque</th><th>Sets</th><th>En plus</th><th>Fonte</th></tr>` + PLATE_KG.map((kg) => {
    const auto = (pl.bumper[kg] || 0) - (doc.plates[kg] || 0);
    return `<tr><td>${String(kg).replace('.', ',')} kg</td><td>${auto || '–'}</td><td><input type="number" min="0" max="99" step="1" data-plate="${kg}" value="${doc.plates[kg] || 0}" aria-label="Disques de ${kg} kg en plus"></td><td>${pl.iron[kg] || '–'}</td></tr>`;
  }).join('');
  const bumperKg = PLATE_KG.reduce((a, kg) => a + kg * (pl.bumper[kg] || 0), 0), ironKg = PLATE_KG.reduce((a, kg) => a + kg * (pl.iron[kg] || 0), 0);
  const pairs = PLATE_KG.reduce((a, kg) => a + kg * 2 * Math.floor((pl.bumper[kg] || 0) / 2), 0);
  const hasBar = doc.items.some((it) => it.type === 'delta');
  $('#plateSummary').innerHTML = `<dt>Disques bumper</dt><dd>${bumperKg} kg</dd><dt>Disques en fonte (haltères)</dt><dd>${ironKg} kg</dd>
    <dt>Barre olympique chargée au maximum</dt><dd><b>${20 + pairs} kg</b></dd>`;
  $('#plateHint').textContent = hasBar ? 'Calcul avec ta barre Delta de 20 kg et les disques par paires.' : 'Calcul avec une barre olympique de 20 kg et les disques par paires.';
}
function shopCSV() {
  const lines = [['Équipement', 'Prix (€)', 'Acheté', 'Lien']];
  for (const it of doc.items) if (!CATALOG[it.type].noBudget) lines.push([nameOf(it), priceOf(it), it.bought ? 'oui' : 'non', urlOf(it)]);
  const s = stats(); lines.push([], ['Total', s.budget], ['Reste à acheter', s.budget - s.bought]);
  return lines.map((l) => l.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';')).join('\n');
}
function addToSession(ex, on) {
  doc.session.push({ id: uid(), ex, on: on || '', sets: 3, reps: 10, kg: 0 });
  commit(); renderSession(); toast(`« ${ex} » ajouté à ta séance`);
}
function renderSession() {
  const el = $('#sessionList'); if (!el) return;
  el.innerHTML = doc.session.length ? doc.session.map((x, i) => `<li data-sid="${x.id}"><span class="num">${i + 1}</span><div class="ex"><b>${esc(x.ex)}</b><small>${esc(x.on)}</small></div>
    <label>Séries<input type="number" min="1" max="20" data-sf="sets" value="${x.sets}"></label><label>Reps<input type="number" min="1" max="100" data-sf="reps" value="${x.reps}"></label><label>kg<input type="number" min="0" max="500" step="0.5" data-sf="kg" value="${x.kg}"></label>
    <button type="button" class="icon-btn" data-sdel aria-label="Retirer"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button></li>`).join('')
    : '<li class="empty">Sélectionne une machine dans la vue, ouvre « Exercices possibles » et clique sur un exercice pour l\'ajouter.</li>';
}
function sessionText() {
  return `${doc.name} : séance\n` + doc.session.map((x, i) => `${i + 1}. ${x.ex}${x.on ? ` (${x.on})` : ''} : ${x.sets} × ${x.reps}${x.kg ? ` à ${String(x.kg).replace('.', ',')} kg` : ''}`).join('\n');
}
const VERSIONS_KEY = 'homegym-studio.versions';
function loadVersions() { try { return JSON.parse(localStorage.getItem(VERSIONS_KEY) || '[]'); } catch { return []; } }
function storeVersions(v) { try { localStorage.setItem(VERSIONS_KEY, JSON.stringify(v)); return true; } catch { toast("Impossible d'enregistrer : le stockage du navigateur est indisponible"); return false; } }
function renderVersions() {
  const el = $('#versionList'); if (!el) return;
  const vs = loadVersions();
  el.innerHTML = vs.length ? vs.map((v) => `<li data-vid="${esc(v.id)}"><span class="name">${esc(v.name)}</span><span class="meta">${new Date(v.date).toLocaleDateString('fr-FR')}</span>
    <button type="button" class="btn" data-vload>Ouvrir</button><button type="button" class="icon-btn" data-vdel aria-label="Supprimer la version"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button></li>`).join('')
    : '<li class="empty">Aucune version enregistrée. Enregistre l\'implantation actuelle pour la comparer à une autre.</li>';
}

/* ---------------------------------------------------------------------------
   Téléchargements, partage, plan à imprimer
--------------------------------------------------------------------------- */
let downloadsCap;
async function saveFile(filename, data, mime) {
  if (downloadsCap === undefined) downloadsCap = window.claude?.use ? await window.claude.use('downloads').catch(() => null) : null;
  if (downloadsCap) {
    try { await downloadsCap.save({ filename, data }); toast('Fichier enregistré'); return; }
    catch (err) { if (err?.code === 'declined') { toast('Téléchargement annulé'); return; } if (err?.code === 'rate_limited') { toast('Un téléchargement est déjà en cours'); return; } }
  }
  const blob = data instanceof Blob ? data : new Blob([data], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  toast('Fichier téléchargé');
}
const slug = () => (doc.name || 'home-gym').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w-]+/g, '-').toLowerCase();
const SHARE_BASE = 'https://warryks.github.io/Homegym/';
async function packPlan(obj) {
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  let out = bytes, tag = 'j';
  if (window.CompressionStream) { out = new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer()); tag = 'z'; }
  let bin = ''; for (const b of out) bin += String.fromCharCode(b);
  return tag + btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
async function unpackPlan(str) {
  const tag = str[0], b64 = str.slice(1).replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64), bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  const raw = tag === 'z' ? new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer()) : bytes;
  return JSON.parse(new TextDecoder().decode(raw));
}
async function shareLink() {
  const { session, ...plan } = doc; void session;
  const link = SHARE_BASE + '#plan=' + (await packPlan(plan));
  openModal('Partager le plan', `<p class="hint">Ce lien ouvre ton plan en lecture seule : la personne peut le regarder et tourner autour, sans modifier ton projet. Il fonctionne depuis la version en ligne du site (GitHub Pages).</p>
    <textarea id="shareOut" readonly></textarea><div class="row"><button type="button" class="btn primary" id="shareCopy">Copier le lien</button></div>`);
  const ta = $('#shareOut'); ta.value = link;
  $('#shareCopy').onclick = async () => { try { await navigator.clipboard.writeText(link); toast('Lien copié'); } catch { ta.focus(); ta.select(); toast('Sélectionne le lien et copie-le'); } };
}
function setReadonly(on) {
  ui.readonly = on;
  $('#roBanner').hidden = !on;
  document.body.classList.toggle('readonly', on);
}
function printSheet() {
  const prev = ui.view, prevSel = ui.sel;
  ui.sel = null; showSelBox();
  setView('plan'); fitView(); updateCutaway();
  coteG.visible = false;
  renderer.render(scene, camera);
  const img = renderer.domElement.toDataURL('image/png');
  coteG.visible = true;
  ui.sel = prevSel; setView(prev); showSelBox();
  const { w: W, d: D, h: H } = doc.room, st = stats();
  const rows = doc.items.filter((it) => !CATALOG[it.type].person).map((it) => {
    const e = extents(it);
    return `<tr><td>${esc(nameOf(it))}</td><td>${cm(it.w)} × ${cm(it.d)} × ${cm(it.h)}</td><td>${cm(it.x + e.x0 + W / 2)}</td><td>${cm(it.z + e.z0 + D / 2)}</td><td>${CATALOG[it.type].noBudget ? '' : euro(priceOf(it))}</td></tr>`;
  }).join('');
  const ops = doc.openings.map((o) => `<li>${esc(OPEN_DEF[o.type].name)} · mur ${SIDE_NAME[o.wall]} · ${cm(o.w)} × ${cm(o.h)} cm, à ${cm(o.pos)} cm ${SIDE_FROM[o.wall]}</li>`).join('');
  openModal('Plan à imprimer', `<div id="printSheet" class="print-sheet">
    <header><h1>${esc(doc.name)}</h1><p>Pièce ${cm(W)} × ${cm(D)} cm · ${cm(H)} cm sous plafond · ${st.area.toFixed(1).replace('.', ',')} m² · budget ≈ ${euro(st.budget)}</p></header>
    <img src="${img}" alt="Plan vu de dessus">
    <p class="hint">Nord en haut. Distances mesurées depuis le mur ouest (x) et le mur nord (z), au bord de chaque équipement.</p>
    <table><thead><tr><th>Équipement</th><th>L × P × H (cm)</th><th>Depuis l'ouest</th><th>Depuis le nord</th><th>Prix</th></tr></thead><tbody>${rows}</tbody></table>
    ${ops ? `<h3>Ouvertures</h3><ul>${ops}</ul>` : ''}</div>
    <div class="row no-print"><button type="button" class="btn primary" id="doPrint">Imprimer ou enregistrer en PDF</button><button type="button" class="btn" id="dlPlan">Télécharger l'image du plan</button></div>
    <p class="hint no-print">Si l'impression ne s'ouvre pas ici, ouvre le site depuis sa version en ligne (GitHub Pages).</p>`);
  $('#doPrint').onclick = () => { try { window.print(); } catch { toast("L'impression n'est pas disponible ici"); } };
  $('#dlPlan').onclick = async () => saveFile(`${slug()}-plan.png`, await (await fetch(img)).blob(), 'image/png');
}
function customDialog() {
  openModal('Créer un équipement', `<form id="customForm" class="custom-form">
    <label>Nom<input type="text" name="label" maxlength="60" required placeholder="Ex. : Banc à lombaires"></label>
    <div class="insp-grid"><label>Largeur (cm)<input type="number" name="w" value="100" min="5" max="800" required></label><label>Profondeur (cm)<input type="number" name="d" value="100" min="5" max="800" required></label><label>Hauteur (cm)<input type="number" name="h" value="100" min="1" max="440" required></label></div>
    <div class="insp-grid"><label>Prix (€)<input type="number" name="price" value="0" min="0" step="1"></label><label>Poids (kg)<input type="number" name="kg" value="0" min="0" step="1"></label><label>Couleur<input type="color" name="color" value="#5d6b7a"></label></div>
    <label>Lien vers la fiche (facultatif)<input type="url" name="url" placeholder="https://"></label>
    <div class="row"><button type="submit" class="btn primary">Ajouter à ma salle</button></div></form>`);
  $('#customForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = new FormData(e.target), g = (k) => num(f.get(k), 0);
    const url = String(f.get('url') || '');
    if (url && !url.startsWith('https://')) { toast('Le lien doit commencer par https://'); return; }
    closeModal();
    addItem('custom', null, { label: String(f.get('label')).slice(0, 60) || 'Équipement', w: clamp(g('w') / 100, 0.05, 8), d: clamp(g('d') / 100, 0.05, 8), h: clamp(g('h') / 100, 0.01, 4.4), price: clamp(g('price'), 0, 1e6), kg: clamp(g('kg'), 0, 5000), color: String(f.get('color')), url });
    switchTab('gear');
  });
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
  openModal('Capture', `<img src="${url}" alt="Capture de la vue ${esc(ui.view)}"><div class="row"><button type="button" class="btn primary" id="dlShot">Télécharger l'image</button></div><p class="hint">Tu peux aussi faire un clic droit ou un appui long sur l'image pour l'enregistrer.</p>`);
  $('#dlShot').onclick = async () => saveFile(`${name}-${ui.view}.png`, await (await fetch(url)).blob(), 'image/png');
}
function exportJSON() { saveFile(`${slug()}.json`, JSON.stringify(doc, null, 2), 'application/json'); }
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
  for (const [id, o] of itemObjs) {
    for (const tk of o.g.userData.ticks || []) tk(t);
    if (o.lifts.length) { const y = ui.sel?.id === id && ui.view !== 'plan' ? 0.16 * (0.5 - 0.5 * Math.cos(t * 2.2)) : 0; for (const l of o.lifts) l.position.y = y; }
  }
  updateCutaway();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
}

async function start() {
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
  let shared = null;
  if (location.hash.startsWith('#plan=')) { try { shared = normalizeDoc(await unpackPlan(location.hash.slice(6))); } catch { toast("Ce lien de partage n'est pas lisible"); } }
  doc = shared || loadSaved() || normalizeDoc(PRESETS.double());
  if (shared) setReadonly(true);
  const legacy = !shared && !doc.migr.includes('r8drift');
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
  // Accès réservé aux tests automatiques (tests/smoke.mjs), seulement avec ?test dans l'adresse.
  if (new URLSearchParams(location.search).has('test')) {
    window.__homegymTest = { doc: () => doc, analysis: () => analysis, addItem, select, setView, snapToHooks, placeItemObj, refreshAnalysis, footprint, nameOf, priceOf, CATALOG, loadDoc, PRESETS, normalizeDoc, packPlan, unpackPlan };
  }
  $('#loading').hidden = true;
}
start();
