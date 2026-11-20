import { cpSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier, canonicalJson } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const appDir = join(here, 'app');
const screenshotDir = join(here, 'screenshots');
let trophyData: { trophies?: Array<{ id: number; grade: string }> };
let shots: Array<{ file: string }>;

try {
  trophyData = JSON.parse(readFileSync(join(appDir, 'data/trophies.json'), 'utf8'));
} catch (error) {
  throw new Error('Unable to parse app/data/trophies.json.', { cause: error });
}
if (!Array.isArray(trophyData.trophies) || trophyData.trophies.length !== 55) {
  throw new Error(`Expected exactly 55 trophies; found ${trophyData.trophies?.length ?? 'no trophy list'}.`);
}

try {
  shots = JSON.parse(readFileSync(join(here, 'shots.json'), 'utf8'));
} catch (error) {
  throw new Error('Unable to parse shots.json.', { cause: error });
}
if (!Array.isArray(shots) || shots.length < 3 || shots.length > 4) {
  throw new Error('shots.json must name three or four screenshots.');
}

const screenshotFacts = shots.map(({ file }) => {
  const path = join(screenshotDir, file);
  if (!existsSync(path) || !statSync(path).isFile()) {
    throw new Error(`Screenshot named in shots.json is missing: ${file}`);
  }
  return { file, bytes: statSync(path).size };
});

const gradeCounts = Object.fromEntries(
  Object.entries(trophyData.trophies.reduce((counts: Record<string, number>, trophy) => {
    counts[trophy.grade] = (counts[trophy.grade] ?? 0) + 1;
    return counts;
  }, {})).sort(([a], [b]) => a.localeCompare(b)),
);
const expectedGrades = { bronze: 46, gold: 2, platinum: 1, silver: 6 };
if (JSON.stringify(gradeCounts) !== JSON.stringify(expectedGrades)) {
  throw new Error(`Unexpected trophy grades: ${JSON.stringify(gradeCounts)}.`);
}

mkdirSync(out, { recursive: true });
cpSync(appDir, join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
cpSync(screenshotDir, join(out, 'screenshots'), { recursive: true });

const dossier = JSON.parse(Buffer.from(buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
})).toString('utf8'));
dossier.text += [
  '',
  '',
  '## Entry facts',
  '',
  `Trophies: ${trophyData.trophies.length} total (${Object.entries(gradeCounts).map(([grade, count]) => `${count} ${grade}`).join(', ')}).`,
  'Screenshots:',
  ...screenshotFacts.map(({ file, bytes }) => `- ${file}: ${bytes} bytes`),
  '',
].join('\n');
if (Buffer.byteLength(dossier.text, 'utf8') > 163840) {
  throw new Error('Dossier text exceeded the configured 163840-byte limit after adding entry facts.');
}
writeFileSync(join(out, 'dossier.json'), canonicalJson(dossier));
