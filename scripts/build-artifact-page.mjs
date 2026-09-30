// Transforme le build Vite en page d'artefact : un fragment HTML (l'hébergeur ajoute doctype, head et body)
// avec le CSS et le JS en ligne, plus les decks à publier à côté.
import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const distDirectory = 'dist';
const outputDirectory = 'artifact';

const assets = readdirSync(join(distDirectory, 'assets'));
function readSingleAsset(extension) {
  const matches = assets.filter((file) => file.endsWith(extension));
  if (matches.length !== 1) {
    throw new Error(`Un seul fichier ${extension} attendu dans dist/assets, trouvé : ${matches.join(', ') || 'aucun'}`);
  }
  return readFileSync(join(distDirectory, 'assets', matches[0]), 'utf8');
}

const sourceHtml = readFileSync('index.html', 'utf8');
const title = sourceHtml.match(/<title>(.*?)<\/title>/)?.[1];
if (title === undefined) throw new Error('<title> introuvable dans index.html');
const fontLinks = [...sourceHtml.matchAll(/<link[^>]+fonts\.(?:googleapis|gstatic)\.com[^>]*>/g)].map((match) => match[0]);

const css = readSingleAsset('.css').replaceAll('</style', '<\\/style');
const js = readSingleAsset('.js').replaceAll('</script', '<\\/script');

const page = [
  `<title>${title}</title>`,
  ...fontLinks,
  `<style>${css}</style>`,
  '<div id="root"></div>',
  `<script type="module">${js}</script>`,
  '',
].join('\n');

rmSync(outputDirectory, { recursive: true, force: true });
mkdirSync(outputDirectory, { recursive: true });
writeFileSync(join(outputDirectory, 'index.html'), page);
cpSync(join(distDirectory, 'decks'), join(outputDirectory, 'decks'), { recursive: true });

console.log(`artifact/index.html : ${Math.round(page.length / 1024)} Ko, decks copiés dans artifact/decks`);
