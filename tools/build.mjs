// Assemble le site en un seul fichier HTML autonome (CSS et JavaScript intégrés, three.js compris).
// Usage : node tools/build.mjs <fichier de sortie>
import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const out = path.resolve(process.argv[2] || 'dist/home-gym-studio.html');

const vendorThree = {
  name: 'vendor-three',
  setup(b) {
    b.onResolve({ filter: /^three$/ }, () => ({ path: path.join(root, 'vendor/three/build/three.module.min.js') }));
    b.onResolve({ filter: /^three\/addons\// }, (a) => ({ path: path.join(root, 'vendor/three', a.path.slice('three/'.length)) }));
  },
};

const res = await build({
  entryPoints: [path.join(root, 'src/app.js')], bundle: true, format: 'esm', minify: true, write: false,
  plugins: [vendorThree], legalComments: 'none', target: 'es2020',
});
const js = res.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const css = fs.readFileSync(path.join(root, 'style.css'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
let head = html.split('<head>')[1].split('</head>')[0];
let body = html.split('<body>')[1].split('</body>')[0];
head = head.replace(/<meta charset[^>]*>\n/, '').replace(/<meta name="viewport"[^>]*>\n/, '')
  .replace(/<link rel="stylesheet" href="style\.css[^"]*">/, () => `<style>\n${css}\n</style>`);
body = body.replace(/<script type="importmap">[\s\S]*?<\/script>\n?/, '')
  .replace(/<script type="module" src="src\/app\.js[^"]*"><\/script>/, () => `<script type="module">\n${js}\n</script>`);
if (!body.includes('<script type="module">')) throw new Error('script principal introuvable dans index.html');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, head.trim() + '\n' + body.trim() + '\n');
console.log(`Écrit ${path.relative(process.cwd(), out)} (${Math.round(fs.statSync(out).size / 1024)} Ko)`);
