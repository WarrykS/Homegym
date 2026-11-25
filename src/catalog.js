// Catalogue : catégories, équipements (dimensions, prix, poids, zones d'usage, exercices) et ouvertures.
//
// Champs d'un équipement :
//   w, d, h        dimensions par défaut (m), l'avant est vers +z local
//   price, kg      prix indicatif (€) et poids net approximatif (kg)
//   url            fiche produit
//   zone           espace d'usage devant (f), derrière (b) et sur les côtés (s)
//   variants       versions du fabricant : [{ v, label, price?, kg?, w?, d?, h? }], la première est celle par défaut
//   options        accessoires montables : [{ key, label, price, on }] (on : monté par défaut)
//   hooks(it)      position locale de la barre posée sur les J-hooks
//   loadPad        place à laisser sur les côtés (s) ou derrière (b) pour charger les disques
//   power          a besoin d'une prise électrique
//   ex             exercices possibles
import { buildRack, buildWallRack, buildBench, buildPlatform, buildDumbbells, buildKettlebells, buildPlateTree, buildTreadmill, buildRower, buildBike, buildCable, buildLegpress, buildBag, buildMirror, buildTV, buildFan, buildPlant, buildPlyo, buildTurf, buildMat, buildShelf, buildFridge } from './models/generic.js';
import { buildR8Drift, buildBradley, buildDuality, EVO_EXT, buildPredator, buildOlyBar, buildEZ, buildBumperSet, buildL1Pair, buildR7Cage, harrierPoly, buildHarrier, r8Hooks, duality, R8_CAGE } from './models/atletica.js';
import { buildPerson, POSES, buildCustom, buildOutlet, buildSpot, buildHeater, buildDehum, buildExtractor, buildDecal } from './models/extras.js';

export const CATS = {
  force: { label: 'Force', color: '#d7262e' },
  libre: { label: 'Charges libres', color: '#1f5fd1' },
  cardio: { label: 'Cardio', color: '#f2b705' },
  sol: { label: 'Sol et fonctionnel', color: '#1f9d55' },
  deco: { label: 'Confort et déco', color: '#8f98a3' },
  elec: { label: 'Électricité et aération', color: '#e0a100' },
  gabarit: { label: 'Gabarits et personnalisés', color: '#6b4fd1' },
};

const ATL = 'https://atletica.de/fr/products/';
const DIPS_R8 = { key: 'dips', label: 'Barres à dips R8', price: 109, on: false };
const EX = {
  rack: ['Squat', 'Développé couché', 'Développé militaire', 'Tractions', 'Soulevé de terre partiel', 'Fentes'],
  cable: ['Tirage vertical', 'Tirage horizontal assis', 'Écarté à la poulie', 'Extension triceps', 'Curl à la poulie', 'Face pull', 'Rotation du buste'],
  dips: ['Dips'],
  landmine: ['Développé landmine', 'Rowing landmine'],
};
const rackEx = (it, extra = []) => [...EX.rack, ...extra, ...(it?.opts?.dips ? EX.dips : [])];

export const CATALOG = {
  r8drift: {
    name: 'Atletica R8 Drift', cat: 'force', w: 2.61, d: 1.23, h: 2.26, price: 1679, kg: 236, url: ATL + 'r8-drift-pro-power-rack', color: '#1b1c1f',
    zone: { f: 1.0, b: 0.3, s: 0.3 }, pullup: true, flip: true, loadPad: { s: 0.3 }, options: [DIPS_R8],
    variants: [{ v: 'plates', label: 'À disques', price: 1679, kg: 236 }, { v: 'stack', label: 'PRO · pile 95 kg', price: 2069, kg: 334 }],
    hooks: r8Hooks, ex: (it) => rackEx(it, EX.cable), build: buildR8Drift,
  },
  bradley: {
    name: 'Atletica R8 Bradley', cat: 'force', w: 1.23, d: 1.23, h: 2.31, price: 1899, kg: 276, url: ATL + 'r8-bradley-medium-plate-loaded-black', color: '#1b1c1f',
    zone: { f: 1.2, b: 0.3, s: 0.45 }, pullup: true, loadPad: { s: 0.3 }, options: [DIPS_R8],
    variants: [{ v: 'long', label: 'Long · 123 cm', d: 1.23, kg: 276 }, { v: 'moyen', label: 'Moyen · 93 cm', d: 0.93, kg: 254 }, { v: 'court', label: 'Court · 57 cm', d: 0.57, kg: 258.5 }],
    hooks: (it) => ({ x: 0, y: 1.46, z: it.d / 2 - R8_CAGE.p / 2 + 0.085 }), ex: (it) => rackEx(it, EX.cable), build: buildBradley,
  },
  duality: {
    name: 'Atletica R8 Duality', cat: 'force', w: 1.63, d: 2.35, h: 2.26, price: 1629, kg: 248, url: ATL + 'power-rack-r8-duality', color: '#1b1c1f',
    zone: { f: 0.5, b: 0.3, s: 0.3 }, pullup: true, loadPad: { s: 0.25 }, options: [DIPS_R8],
    hooks: (it) => ({ x: 0, y: 1.46, z: duality(it).zf + 0.085 }), ex: (it) => rackEx(it, EX.cable), build: buildDuality,
  },
  r7cage: {
    name: 'Atletica R7 Cage', cat: 'force', w: 1.22, d: 1.86, h: 2.24, price: 1099, kg: 155, url: ATL + 'r7-cage-power-rack-station-dips-plate-loaded-224cm', color: '#1b1c1f',
    zone: { f: 0.8, b: 0.3, s: 0.4 }, pullup: true, loadPad: { s: 0.25 },
    variants: [{ v: '224', label: '224 cm', h: 2.24 }, { v: '204', label: '204 cm', h: 2.04 }],
    options: [{ key: 'dips', label: 'Station à dips (incluse)', price: 0, on: true }, { key: 'landmine', label: 'Landmine (incluse)', price: 0, on: true }],
    hooks: (it) => { const d = it.d, rear = Math.min(0.3, d * 0.16), zr = -d / 2 + rear + 0.035; return { x: 0, y: 1.48, z: zr + Math.min(1.2, d - rear - 0.1) - 0.07 + 0.085 }; },
    ex: (it) => [...rackEx(it, ['Tirage vertical', 'Rameur assis']), ...(it?.opts?.landmine !== false ? EX.landmine : [])], build: buildR7Cage,
  },
  harrier: {
    name: 'Atletica Harrier', cat: 'force', w: 1.71, d: 1.005, h: 2.108, price: 1399, kg: 276.5, url: ATL + 'harrier-station-poulie-functional-trainer-poulie', color: '#1b1c1f',
    zone: { f: 1.2, b: 0, s: 0.2 }, poly: harrierPoly, corner: true, ex: () => [...EX.cable, 'Tractions'], build: buildHarrier,
  },
  predator: {
    name: 'Banc Predator', cat: 'force', w: 0.655, d: 1.5, h: 0.46, price: 379, kg: 44.5, url: ATL + 'predator-modular-weight-bench', color: '#1a1b1d',
    zone: { f: 0.3, b: 0.3, s: 0.5 }, zoneOk: true, evo: true, ex: (it) => ['Développé couché', 'Développé incliné', 'Rowing haltère', 'Hip thrust', ...(it?.evo ? ['Curl pupitre (EVO Arm)'] : [])], build: buildPredator,
  },
  rack: { name: 'Power rack', cat: 'force', w: 1.22, d: 1.4, h: 2.3, price: 690, kg: 90, color: '#1c1d20', zone: { f: 1.0, b: 0.2, s: 0.5 }, pullup: true, hooks: (it) => ({ x: 0, y: 1.46, z: it.d / 2 - 0.0375 + 0.085 }), ex: () => EX.rack, build: buildRack },
  wallrack: { name: 'Rack mural repliable', cat: 'force', w: 1.2, d: 0.56, h: 2.2, price: 520, kg: 50, color: '#1c1d20', zone: { f: 1.4, b: 0, s: 0.55 }, wall: true, pullup: true, hooks: (it) => ({ x: 0, y: 1.46, z: it.d / 2 - 0.0375 + 0.085 }), ex: () => EX.rack, build: buildWallRack },
  bench: { name: 'Banc réglable', cat: 'force', w: 0.6, d: 1.35, h: 0.45, price: 260, kg: 25, color: '#1e2024', zone: { f: 0.3, b: 0.3, s: 0.5 }, zoneOk: true, ex: () => ['Développé couché', 'Développé incliné', 'Rowing haltère'], build: buildBench },
  cable: { name: 'Poulie vis-à-vis', cat: 'force', w: 3.4, d: 0.9, h: 2.25, price: 1890, kg: 300, color: '#2a2c30', zone: { f: 1.6, b: 0, s: 0.2 }, ex: () => EX.cable, build: buildCable },
  legpress: { name: 'Presse à cuisses 45°', cat: 'force', w: 1.5, d: 2.1, h: 1.45, price: 1290, kg: 200, color: '#1c1d20', zone: { f: 0.3, b: 0.5, s: 0.6 }, loadPad: { s: 0.3 }, ex: () => ['Presse à cuisses', 'Mollets à la presse'], build: buildLegpress },
  platform: { name: "Plateforme d'haltérophilie", cat: 'libre', w: 2.44, d: 2.44, h: 0.05, price: 380, kg: 60, color: '#c8975a', flat: true, ex: () => ['Soulevé de terre', 'Épaulé-jeté', 'Arraché'], build: buildPlatform },
  delta: { name: 'Barre olympique Delta', cat: 'libre', w: 2.2, d: 0.06, h: 0.05, price: 249, kg: 20, url: 'https://atletica.de/fr/search?q=delta', color: '#d7dbe0', noCollide: true, lift: true, ex: () => ['Squat', 'Soulevé de terre', 'Développé couché', 'Rowing barre'], build: buildOlyBar },
  ezbar: { name: 'Barre EZ', cat: 'libre', w: 1.2, d: 0.08, h: 0.05, price: 89, kg: 9.5, url: 'https://atletica.de/en/products/ez-curl-bar-50mm', color: '#d7dbe0', noCollide: true, lift: true, ex: () => ['Curl barre EZ', 'Barre au front', 'Rowing menton'], build: buildEZ },
  bumpers110: { name: 'Disques bumper noirs 110 kg', cat: 'libre', w: 0.62, d: 0.5, h: 0.47, price: 392, kg: 125, url: 'https://atletica.de/en/products/110-kg-set-price-color-bumper-plates', color: '#1a1b1d', zone: { f: 0.4, b: 0, s: 0.2 }, plates: { 20: 4, 10: 2, 5: 2 }, build: buildBumperSet },
  l1pair: { name: 'Haltères L1 Olympia (2 sets)', cat: 'libre', w: 0.52, d: 0.55, h: 0.23, price: 500, kg: 108, url: 'https://atletica.de/en/products/l1-olympic-dumbbell-with-475-kg-iron-plates-52-cm-long', color: '#2b2d31', noCollide: true, ironPlates: { 5: 16, 2.5: 4, 1.25: 4 }, ex: () => ['Développé haltères', 'Rowing haltère', 'Curl', 'Fentes haltères'], build: buildL1Pair },
  dumbbells: { name: "Rack d'haltères", cat: 'libre', w: 1.3, d: 0.55, h: 0.82, price: 1450, kg: 300, color: '#1c1d20', zone: { f: 1.0, b: 0, s: 0.2 }, ex: () => ['Développé haltères', 'Curl', 'Élévations latérales'], build: buildDumbbells },
  kettlebells: { name: 'Étagère kettlebells', cat: 'libre', w: 1.0, d: 0.36, h: 0.62, price: 520, kg: 140, color: '#1c1d20', zone: { f: 0.8, b: 0, s: 0.1 }, ex: () => ['Swing', 'Goblet squat', 'Turkish get-up'], build: buildKettlebells },
  platetree: { name: 'Arbre à disques', cat: 'libre', w: 0.6, d: 0.6, h: 1.2, price: 450, kg: 150, color: '#1c1d20', zone: { f: 0.4, b: 0.4, s: 0.3 }, build: buildPlateTree },
  treadmill: { name: 'Tapis de course', cat: 'cardio', w: 0.85, d: 1.85, h: 1.45, price: 1290, kg: 110, color: '#26282c', zone: { f: 0.2, b: 2.0, s: 0.5 }, power: true, ex: () => ['Course', 'Marche inclinée'], build: buildTreadmill },
  rower: { name: 'Rameur', cat: 'cardio', w: 0.6, d: 2.44, h: 1.0, price: 1090, kg: 26, color: '#1b1c1f', zone: { f: 0.3, b: 0.6, s: 0.6 }, ex: () => ['Rameur'], build: buildRower },
  bike: { name: 'Air bike', cat: 'cardio', w: 0.65, d: 1.3, h: 1.3, price: 990, kg: 50, color: '#1c1d20', zone: { f: 0.3, b: 0.6, s: 0.5 }, ex: () => ['Air bike'], build: buildBike },
  bag: { name: 'Sac de frappe', cat: 'sol', w: 0.36, d: 0.36, h: 1.2, price: 180, kg: 40, color: '#a3161f', zone: { f: 0.75, b: 0.75, s: 0.75 }, hang: true, ex: () => ['Boxe'], build: buildBag },
  turf: { name: 'Piste gazon + traîneau', cat: 'sol', w: 1.0, d: 5.0, h: 0.015, price: 620, kg: 30, color: '#3c7b33', flat: true, ex: () => ['Poussée de traîneau', 'Tirage de traîneau'], build: buildTurf },
  plyo: { name: 'Box de saut', cat: 'sol', w: 0.76, d: 0.61, h: 0.51, price: 140, kg: 15, color: '#c99a63', zone: { f: 0.6, b: 0.6, s: 0.4 }, ex: () => ['Box jump', 'Step-up'], build: buildPlyo },
  mat: { name: 'Tapis de sol', cat: 'sol', w: 0.61, d: 1.83, h: 0.01, price: 35, kg: 1, color: '#5b7a6a', flat: true, ex: () => ['Gainage', 'Étirements'], build: buildMat },
  mirror: { name: 'Miroir mural', cat: 'deco', w: 2.0, d: 0.03, h: 1.8, elev: 0.3, price: 240, kg: 25, color: '#141517', wall: true, build: buildMirror },
  tv: { name: 'Écran mural', cat: 'deco', w: 1.25, d: 0.06, h: 0.72, elev: 1.35, price: 450, kg: 15, color: '#0c0d0f', wall: true, power: true, build: buildTV },
  decal: { name: 'Sticker / logo mural', cat: 'deco', w: 1.4, d: 0.005, h: 0.45, elev: 1.7, price: 40, kg: 0.2, color: '#d7262e', wall: true, text: true, build: buildDecal },
  shelf: { name: 'Étagère de rangement', cat: 'deco', w: 1.2, d: 0.45, h: 1.8, price: 110, kg: 30, color: '#2c2f34', zone: { f: 0.5, b: 0, s: 0 }, build: buildShelf },
  fridge: { name: 'Frigo à boissons', cat: 'deco', w: 0.5, d: 0.55, h: 0.85, price: 220, kg: 30, color: '#f2f2f0', zone: { f: 0.5, b: 0, s: 0 }, power: true, build: buildFridge },
  fan: { name: 'Ventilateur', cat: 'deco', w: 0.5, d: 0.45, h: 1.25, price: 90, kg: 8, color: '#c9ccd1', power: true, build: buildFan },
  plant: { name: 'Plante verte', cat: 'deco', w: 0.45, d: 0.45, h: 1.3, price: 60, kg: 15, color: '#9c9a94', build: buildPlant },
  outlet: { name: 'Prise électrique', cat: 'elec', w: 0.085, d: 0.02, h: 0.085, elev: 0.3, price: 25, kg: 0.1, color: '#f4f4f2', wall: true, noCollide: true, outlet: true, build: buildOutlet },
  spot: { name: 'Luminaire au plafond', cat: 'elec', w: 0.6, d: 0.6, h: 0.06, price: 80, kg: 3, color: '#f4f4f2', ceiling: true, noCollide: true, build: buildSpot },
  extractor: { name: 'Aérateur mural', cat: 'elec', w: 0.25, d: 0.06, h: 0.25, elev: 2.0, price: 70, kg: 2, color: '#e9e9e6', wall: true, noCollide: true, airflow: true, power: true, build: buildExtractor },
  heater: { name: "Radiateur d'appoint", cat: 'elec', w: 0.6, d: 0.25, h: 0.6, price: 120, kg: 8, color: '#f2f2f0', zone: { f: 0.5, b: 0, s: 0 }, power: true, build: buildHeater },
  dehum: { name: 'Déshumidificateur', cat: 'elec', w: 0.35, d: 0.28, h: 0.55, price: 180, kg: 12, color: '#f2f2f0', airflow: true, power: true, build: buildDehum },
  person: {
    name: 'Silhouette', cat: 'gabarit', w: 0.55, d: 0.35, h: 1.8, price: 0, kg: 0, color: '#9aa3ad', noCollide: true, person: true, noBudget: true,
    variants: Object.entries(POSES).map(([v, p]) => ({ v, label: p.label, w: p.w, d: p.d })), build: buildPerson,
  },
  custom: { name: 'Équipement personnalisé', cat: 'gabarit', w: 1.0, d: 1.0, h: 1.0, price: 0, kg: 0, color: '#5d6b7a', zone: { f: 0.6, b: 0, s: 0 }, custom: true, hidden: true, build: buildCustom },
};

export { POSES, EVO_EXT };

export const OPEN_DEF = {
  garage: { name: 'Porte de garage', w: 2.4, h: 2.0, color: '#3b4047' },
  door: { name: 'Porte', w: 0.9, h: 2.1, color: '#f2f1ee' },
  window: { name: 'Fenêtre', w: 1.2, h: 1.0, sill: 1.1, color: '#2f3338' },
};

// Version (variante fabricant) actuellement choisie pour un équipement.
export function variantOf(it) {
  const vs = CATALOG[it.type]?.variants; if (!vs) return null;
  return vs.find((x) => x.v === it.variant) || vs[0];
}
// Option montée ou non (sinon sa valeur par défaut).
export function optOn(it, key) {
  const o = CATALOG[it.type]?.options?.find((x) => x.key === key);
  return it.opts && key in it.opts ? !!it.opts[key] : !!o?.on;
}
export function nameOf(it) {
  const def = CATALOG[it.type];
  if (def.custom) return it.label || def.name;
  const v = variantOf(it);
  return def.name + (v && !def.person ? ' · ' + v.label : '') + (it.evo ? ' + EVO Arm' : '');
}
export function priceOf(it) {
  const def = CATALOG[it.type];
  if (def.custom) return +it.price || 0;
  const v = variantOf(it);
  let p = v?.price ?? def.price;
  for (const o of def.options || []) if (optOn(it, o.key)) p += o.price;
  if (it.evo) p += 199;
  return p;
}
export function kgOf(it) {
  const def = CATALOG[it.type];
  if (def.custom) return +it.kg || 0;
  return (variantOf(it)?.kg ?? def.kg ?? 0) + (it.evo ? 18 : 0);
}
export function urlOf(it) {
  const def = CATALOG[it.type];
  const u = def.custom ? it.url : (it.type === 'r8drift' && variantOf(it).v === 'plates' ? ATL + 'r8_drift' : def.url);
  return /^https:\/\//.test(u || '') ? u : '';
}
export function exercisesOf(it) {
  const def = CATALOG[it.type];
  return def.ex ? def.ex(it) : [];
}
