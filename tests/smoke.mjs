// Test de fumée : charge le site dans Chromium (sans réseau), ajoute chaque équipement du catalogue dans une pièce vide,
// passe par toutes les vues et vérifie qu'aucune erreur ne survient.
// Usage : npm test   (variables facultatives : CHROME_PATH, PLAYWRIGHT_MODULE)
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const types = { '.js': 'application/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json' };

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/ERR_FAILED|net::/.test(m.text())) errors.push(m.text()); });
await page.route('**/*', (route) => {
  const u = new URL(route.request().url());
  if (u.hostname !== 'local') return route.abort();
  const f = path.join(root, decodeURIComponent(u.pathname));
  if (!fs.existsSync(f)) return route.fulfill({ status: 404, body: 'introuvable' });
  return route.fulfill({ body: fs.readFileSync(f), contentType: types[path.extname(f)] || 'application/octet-stream' });
});
await page.goto('http://local/index.html?test');
await page.waitForFunction(() => window.__homegymTest, null, { timeout: 30000 });

const report = await page.evaluate(async () => {
  const T = window.__homegymTest, out = [];
  const empty = T.PRESETS.double(); empty.items = [];
  T.loadDoc(empty);
  for (const [type, def] of Object.entries(T.CATALOG)) {
    if (def.hidden) continue;
    T.addItem(type);
    const it = T.doc().items.at(-1);
    const fp = T.footprint(it), { w, d } = T.doc().room;
    const inside = fp.every(([x, z]) => Math.abs(x) <= w / 2 + 0.01 && Math.abs(z) <= d / 2 + 0.01);
    const sizeOk = Math.abs(it.w - (def.variants?.[0]?.w ?? def.w)) < 1e-6 || def.person;
    out.push({ type, inside, sizeOk, price: T.priceOf(it) });
  }
  T.addItem('custom', null, { label: 'Test', w: 1, d: 1, h: 1, price: 10 });
  for (const v of ['plan', 'iso', 'orbit', 'walk', 'elev', 'iso']) T.setView(v);
  const packed = await T.packPlan(T.doc()), back = await T.unpackPlan(packed);
  return { items: out, roundTrip: back.items.length === T.doc().items.length, checks: T.analysis().global.length >= 0 };
});
await page.waitForTimeout(500);
await browser.close();

const fails = [];
for (const r of report.items) {
  if (!r.inside) fails.push(`${r.type} : placé hors de la pièce`);
  if (!r.sizeOk) fails.push(`${r.type} : dimensions différentes du catalogue`);
  if (!(r.price >= 0)) fails.push(`${r.type} : prix invalide`);
}
if (!report.roundTrip) fails.push('lien de partage : le plan ne se relit pas à l’identique');
for (const e of errors) fails.push('erreur JavaScript : ' + e);
console.log(`${report.items.length} équipements testés, ${fails.length} problème(s).`);
if (fails.length) { console.log(fails.map((f) => ' - ' + f).join('\n')); process.exit(1); }
