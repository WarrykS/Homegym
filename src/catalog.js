// Catalogue : catégories, équipements (dimensions, prix, zones d'usage) et ouvertures.
import { buildRack, buildWallRack, buildBench, buildPlatform, buildDumbbells, buildKettlebells, buildPlateTree, buildTreadmill, buildRower, buildBike, buildCable, buildLegpress, buildBag, buildMirror, buildTV, buildFan, buildPlant, buildPlyo, buildTurf, buildMat, buildShelf, buildFridge } from './models/generic.js';
import { buildR8Drift, buildBradley, buildDuality, EVO_EXT, buildPredator, buildOlyBar, buildEZ, buildBumperSet, buildL1Pair, buildR7Cage, harrierPoly, buildHarrier } from './models/atletica.js';

export const CATS = {
  force: { label: 'Force', color: '#d7262e' },
  libre: { label: 'Charges libres', color: '#1f5fd1' },
  cardio: { label: 'Cardio', color: '#f2b705' },
  sol: { label: 'Sol et fonctionnel', color: '#1f9d55' },
  deco: { label: 'Confort et déco', color: '#8f98a3' },
};


export const CATALOG = {
  r8drift: { name: 'Atletica R8 Drift', cat: 'force', w: 2.61, d: 1.23, h: 2.26, price: 1679, priceOf: (it) => (it.variant === 'stack' ? 2069 : 1679), color: '#1b1c1f', zone: { f: 1.0, b: 0.3, s: 0.3 }, pullup: true, flip: true, variants: true, build: buildR8Drift },
  bradley: { name: 'Atletica R8 Bradley Moyen', cat: 'force', w: 1.23, d: 1.23, h: 2.31, price: 1899, color: '#1b1c1f', zone: { f: 1.2, b: 0.3, s: 0.45 }, pullup: true, build: buildBradley },
  duality: { name: 'Atletica R8 Duality', cat: 'force', w: 1.63, d: 2.35, h: 2.26, price: 1629, color: '#1b1c1f', zone: { f: 0.5, b: 0.3, s: 0.3 }, pullup: true, build: buildDuality },
  predator: { name: 'Banc Predator', cat: 'force', w: 0.655, d: 1.5, h: 0.46, price: 379, priceOf: (it) => 379 + (it.evo ? 199 : 0), color: '#1a1b1d', zone: { f: 0.3, b: 0.3, s: 0.5 }, zoneOk: true, evo: true, build: buildPredator },
  r7cage: { name: 'Atletica R7 Cage 224 cm', cat: 'force', w: 1.22, d: 1.86, h: 2.24, price: 1099, color: '#1b1c1f', zone: { f: 0.8, b: 0.3, s: 0.4 }, pullup: true, build: buildR7Cage },
  harrier: { name: 'Atletica Harrier', cat: 'force', w: 1.71, d: 1.005, h: 2.108, price: 1399, color: '#1b1c1f', zone: { f: 1.2, b: 0, s: 0.2 }, poly: harrierPoly, corner: true, build: buildHarrier },
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

export const OPEN_DEF = {
  garage: { name: 'Porte de garage', w: 2.4, h: 2.0, color: '#3b4047' },
  door: { name: 'Porte', w: 0.9, h: 2.1, color: '#f2f1ee' },
  window: { name: 'Fenêtre', w: 1.2, h: 1.0, sill: 1.1, color: '#2f3338' },
};
