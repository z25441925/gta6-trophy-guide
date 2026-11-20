import { cpSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier, canonicalJson } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const appDir = join(here, 'app');
const screenshotDir = join(here, 'screenshots');
const trophyData = JSON.parse(readFileSync(join(appDir, 'data/trophies.json'), 'utf8')) as {
  trophies?: Array<{ id: number; grade: string }>;
};

if (!existsSync(join(appDir, 'index.html')) || !existsSync(join(appDir, 'app.js')) || !existsSync(join(appDir, 'style.css'))) {
  throw new Error('The app is incomplete: expected app/index.html, app/app.js, and app/style.css.');
}
if (!Array.isArray(trophyData.trophies) || trophyData.trophies.length !== 55) {
  throw new Error(`Expected exactly 55 trophies; found ${trophyData.trophies?.length ?? 'no trophy list'}.`);
}

const gradeCounts = trophyData.trophies.reduce((counts: Record<string, number>, trophy) => {
  counts[trophy.grade] = (counts[trophy.grade] ?? 0) + 1;
  return counts;
}, {});
const expectedGrades = { bronze: 46, silver: 6, gold: 2, platinum: 1 };
const sortedGradeCounts = Object.fromEntries(Object.entries(gradeCounts).sort(([a], [b]) => a.localeCompare(b)));
const sortedExpectedGrades = Object.fromEntries(Object.entries(expectedGrades).sort(([a], [b]) => a.localeCompare(b)));
if (JSON.stringify(sortedGradeCounts) !== JSON.stringify(sortedExpectedGrades)) {
  throw new Error(`Unexpected trophy grades: ${JSON.stringify(gradeCounts)}.`);
}

const shots = JSON.parse(readFileSync(join(here, 'shots.json'), 'utf8')) as Array<{ file: string }>;
if (!Array.isArray(shots) || shots.length < 3 || shots.length > 4) {
  throw new Error('shots.json must name three or four screenshots.');
}
const seenShots = new Set<string>();
const screenshotFacts = shots.map(({ file }) => {
  if (typeof file !== 'string' || basename(file) !== file || seenShots.has(file)) {
    throw new Error(`Invalid or repeated screenshot name in shots.json: ${String(file)}.`);
  }
  seenShots.add(file);
  const path = join(screenshotDir, file);
  if (!existsSync(path) || !statSync(path).isFile()) {
    throw new Error(`Screenshot named in shots.json is missing: ${file}`);
  }
  return { file, bytes: statSync(path).size };
});

mkdirSync(out, { recursive: true });
cpSync(appDir, join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
cpSync(screenshotDir, join(out, 'screenshots'), { recursive: true });

const dossier = JSON.parse(Buffer.from(buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648
})).toString('utf8'));
dossier.text += [
  '',
  '',
  '## Entry facts',
  '',
  `Trophies: ${trophyData.trophies.length} total (${Object.entries(expectedGrades).map(([grade, count]) => `${count} ${grade}`).join(', ')}).`,
  'Screenshot file sizes:',
  ...screenshotFacts.map(({ file, bytes }) => `- ${file}: ${bytes} bytes`),
  ''
].join('\n');
if (Buffer.byteLength(dossier.text, 'utf8') > 163840) {
  throw new Error('Dossier text exceeded the configured 163840-byte limit after adding entry facts.');
}
writeFileSync(join(out, 'dossier.json'), canonicalJson(dossier));
