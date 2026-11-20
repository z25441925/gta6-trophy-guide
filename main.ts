import { cpSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const trophyPath = join(here, 'app', 'data', 'trophies.json');
const trophyData = JSON.parse(readFileSync(trophyPath, 'utf8')) as {
  trophies?: { grade?: string }[];
};
if (!Array.isArray(trophyData.trophies) || trophyData.trophies.length !== 55) {
  throw new Error(`${trophyPath} must contain exactly 55 trophies`);
}

const gradeCounts = trophyData.trophies.reduce<Record<string, number>>((counts, trophy) => {
  const grade = trophy.grade ?? 'unspecified';
  counts[grade] = (counts[grade] ?? 0) + 1;
  return counts;
}, {});

const shotsPath = join(here, 'shots.json');
const shots = JSON.parse(readFileSync(shotsPath, 'utf8')) as { file?: string }[];
if (!Array.isArray(shots)) throw new Error(`${shotsPath} must contain an array`);

const screenshotSizes = shots.map(({ file }) => {
  if (typeof file !== 'string' || basename(file) !== file) {
    throw new Error(`${shotsPath} contains an invalid screenshot filename`);
  }
  const path = join(here, 'screenshots', file);
  if (!existsSync(path) || !statSync(path).isFile()) {
    throw new Error(`Screenshot listed in ${shotsPath} does not exist: ${file}`);
  }
  return { file, bytes: statSync(path).size };
});

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

const dossier = JSON.parse(new TextDecoder().decode(
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
)) as { text: string };

dossier.text += [
  '',
  '## Entry facts',
  '',
  `Trophies: ${trophyData.trophies.length}`,
  `Trophies by grade: ${Object.entries(gradeCounts).sort(([a], [b]) => a.localeCompare(b)).map(([grade, count]) => `${grade} ${count}`).join(', ')}`,
  `Screenshot file sizes: ${screenshotSizes.map(({ file, bytes }) => `${file} ${bytes} bytes`).join(', ')}`,
  '',
].join('\n');

writeFileSync(join(out, 'dossier.json'), JSON.stringify(dossier));
