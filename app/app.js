const STORAGE_KEY = 'vice-tracker-progress-v1';
const SPOILER_KEY = 'vice-tracker-spoilers-v1';
const trophyList = document.querySelector('#trophy-list');
const roadmapList = document.querySelector('#roadmap-list');
const guideList = document.querySelector('#guide-list');
const statusMessage = document.querySelector('#status-message');
const gradeFilter = document.querySelector('#grade-filter');
const kindFilter = document.querySelector('#kind-filter');
const search = document.querySelector('#search');
const spoilerToggle = document.querySelector('#spoiler-toggle');
let trophies = [];
let earned = new Set();
let showSpoilers = localStorage.getItem(SPOILER_KEY) === 'true';
let messageTimer;

const kindDefinitions = [
  { key: 'story', label: 'Story' },
  { key: 'activities', label: 'Activities' },
  { key: 'collectibles', label: 'Collectibles' },
  { key: 'exploration', label: 'Exploration' },
  { key: 'crime', label: 'Crime & combat' },
  { key: 'lifestyle', label: 'Lifestyle & other' },
];

function kindFor(trophy) {
  const text = `${trophy.description} ${trophy.guide}`;
  if (/complete (?:gone fishing|chapter \d+|the final mission|breakfast run|the cartel heist|child's play|headliners|vcia takedown|operation savage glory)|final mission for|mission strands/i.test(text)) return 'story';
  if (/collectible|card sets/i.test(text)) return 'collectibles';
  if (/explore|areas of leonida|discover \d+ vehicles|locations|spots across/i.test(text)) return 'exploration';
  if (/rob |rob\b|wanted level|escape the heat|enemies|combat focus|armored truck|bank vault|jewelry store|illegal operation|gang|rhino|tanks/i.test(text)) return 'crime';
  if (/stunt|activity|shooting range|drone race|races|fishing challenge|arcade game|challenges|meditate|hunt a unique|waink/i.test(text)) return 'activities';
  return 'lifestyle';
}

function phaseFor(trophy) {
  if (trophy.grade === 'platinum' || /100% completion/i.test(trophy.description)) return 4;
  return {
    story: 0,
    activities: 1,
    collectibles: 2,
    exploration: 2,
    crime: 3,
    lifestyle: 3,
  }[trophy.kind];
}

function makeElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function showMessage(text, isError = false) {
  clearTimeout(messageTimer);
  statusMessage.textContent = text;
  statusMessage.classList.toggle('error', isError);
  statusMessage.classList.add('visible');
  messageTimer = setTimeout(() => statusMessage.classList.remove('visible'), 3600);
}

function saveProgress() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...earned]));
  } catch {
    showMessage('Progress could not be saved in this browser.', true);
  }
}

function isHiddenStory(trophy) {
  return trophy.kind === 'story' && !showSpoilers && !earned.has(trophy.id);
}

function gradeBadge(grade) {
  return makeElement('span', `grade-badge grade-${grade}`, grade);
}

function missableBadge() {
  return makeElement('span', 'missable-badge', 'MISSABLE');
}

function guideCopy(trophy) {
  return trophy.guide;
}

function appendMissableBadge(parent, trophy) {
  if (trophy.missable) parent.append(missableBadge());
}

function appendGuideText(parent, trophy) {
  parent.append(makeElement('p', 'guide-copy', guideCopy(trophy)));
  if (trophy.missable) {
    const when = makeElement('p', 'missable-window');
    when.append(makeElement('strong', '', 'When it can be missed: '), document.createTextNode(trophy.missableWindow));
    parent.append(when);
  }
  parent.append(makeElement('p', 'guide-citation', 'Source: Grand Theft Auto VI — PlayStation 5 official trophy list.'));
}

function makeGuideDetails(trophy) {
  const details = makeElement('details', 'guide-details');
  const summary = makeElement('summary', '', 'Read field guide');
  const content = makeElement('div', 'guide-copy');
  appendGuideText(content, trophy);
  details.append(summary, content);
  return details;
}

function makeEarnControl(trophy, hidden = false) {
  const label = makeElement('label', 'earned-control');
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = earned.has(trophy.id);
  checkbox.setAttribute('aria-label', hidden ? 'Mark concealed story trophy as earned' : `Mark ${trophy.name} as earned`);
  checkbox.addEventListener('change', () => {
    if (checkbox.checked) earned.add(trophy.id);
    else earned.delete(trophy.id);
    saveProgress();
    render();
  });
  label.append(checkbox, makeElement('span', 'checkmark'));
  return label;
}

function makeTrophyCard(trophy, compact = false) {
  const hidden = isHiddenStory(trophy);
  const article = makeElement('article', `trophy-card${earned.has(trophy.id) ? ' is-earned' : ''}${compact ? ' compact-card' : ''}`);
  const check = makeEarnControl(trophy, hidden);
  const main = makeElement('div', 'trophy-main');
  const titleLine = makeElement('div', 'title-line');
  titleLine.append(
    makeElement('span', 'trophy-number', String(trophy.id).padStart(2, '0')),
    makeElement('h3', hidden ? 'spoiler-text' : '', hidden ? 'Story trophy hidden' : trophy.name),
  );
  const description = makeElement('p', `trophy-description${hidden ? ' spoiler-text' : ''}`, hidden ? 'Reveal story spoilers or earn this trophy to see its requirement.' : trophy.description);
  const tags = makeElement('div', 'trophy-tags');
  tags.append(gradeBadge(trophy.grade), makeElement('span', 'kind-tag', kindDefinitions.find((kind) => kind.key === trophy.kind).label));
  appendMissableBadge(tags, trophy);
  main.append(titleLine, description, tags);
  article.append(check, main);
  if (!compact && !hidden) main.append(makeGuideDetails(trophy));
  else if (!compact && hidden) main.append(makeElement('span', 'hidden-hint', 'Guide hidden'));
  return article;
}

function updateProgress() {
  const count = earned.size;
  const percentage = Math.round((count / trophies.length) * 100);
  const hasPlatinum = earned.has(trophies.find((trophy) => trophy.grade === 'platinum')?.id);
  document.querySelector('#earned-count').textContent = String(count);
  document.querySelector('#progress-percent').textContent = String(percentage);
  document.querySelector('#progress-fill').style.width = `${percentage}%`;
  document.querySelector('.progress-track').setAttribute('aria-valuenow', String(count));
  document.querySelector('#platinum-progress').textContent = `${hasPlatinum ? 1 : 0} / 1 platinum`;
  document.querySelector('#platinum-status').textContent = hasPlatinum ? 'UNLOCKED' : 'LOCKED';
}

function matchesSearch(trophy, query) {
  if (!query) return true;
  if (isHiddenStory(trophy)) return false;
  return `${trophy.name} ${trophy.description}`.toLocaleLowerCase().includes(query);
}

function renderTracker() {
  trophyList.replaceChildren();
  const query = search.value.trim().toLocaleLowerCase();
  const filtered = trophies.filter((trophy) =>
    (gradeFilter.value === 'all' || trophy.grade === gradeFilter.value)
    && (kindFilter.value === 'all' || trophy.kind === kindFilter.value)
    && matchesSearch(trophy, query));
  for (const trophy of filtered) trophyList.append(makeTrophyCard(trophy));
  document.querySelector('#shown-count').textContent = String(filtered.length);
  document.querySelector('#empty-state').hidden = filtered.length !== 0;
}

const roadmapPhases = [
  { title: 'The story spine', subtitle: 'Build your campaign foundation', note: 'Follow the listed story milestones in order. Story details stay concealed when spoiler protection is on.' },
  { title: 'Side paths & skill checks', subtitle: 'Make room for activities', note: 'Pick up activity-based requirements as they become available; the official list does not state when they unlock.' },
  { title: 'Collections & Leonida', subtitle: 'Turn exploration into progress', note: 'Work across collection and exploration goals without relying on unsupported map locations.' },
  { title: 'Crime, combat & the rest', subtitle: 'Clear the open-ended checklist', note: 'Finish the listed optional conditions at your own pace; confirm any time-sensitive requirements from a verified source.' },
  { title: 'Completion sweep', subtitle: 'Close out the platinum', note: 'The 100% requirement and platinum sit at the end of this roadmap. Platinum requires the other 54 trophies.' },
];

function renderRoadmap() {
  roadmapList.replaceChildren();
  roadmapPhases.forEach((phase, index) => {
    const phaseTrophies = trophies.filter((trophy) => phaseFor(trophy) === index);
    const section = makeElement('section', 'roadmap-phase');
    const heading = makeElement('div', 'phase-heading');
    const marker = makeElement('span', 'phase-marker', String(index + 1).padStart(2, '0'));
    const title = makeElement('div', 'phase-title');
    title.append(makeElement('h3', '', phase.title), makeElement('p', '', phase.subtitle));
    heading.append(marker, title, makeElement('span', 'phase-count', `${phaseTrophies.length} TROPHIES`));
    const body = makeElement('p', 'phase-note', phase.note);
    const list = makeElement('div', 'phase-trophies');
    for (const trophy of phaseTrophies) list.append(makeTrophyCard(trophy, true));
    section.append(heading, body, list);
    roadmapList.append(section);
  });
}

function renderGuides() {
  guideList.replaceChildren();
  for (const trophy of trophies) {
    const hidden = isHiddenStory(trophy);
    const item = makeElement('article', 'field-guide-item');
    const heading = makeElement('div', 'field-guide-heading');
    heading.append(
      makeElement('span', 'trophy-number', String(trophy.id).padStart(2, '0')),
      makeElement('h3', hidden ? 'spoiler-text' : '', hidden ? 'Story trophy hidden' : trophy.name),
      gradeBadge(trophy.grade),
    );
    appendMissableBadge(heading, trophy);
    if (hidden) item.append(heading, makeElement('p', 'hidden-hint', 'Guide hidden while story spoilers are off.'));
    else {
      item.append(heading, makeElement('p', 'field-guide-requirement', trophy.description));
      appendGuideText(item, trophy);
    }
    guideList.append(item);
  }
}

function render() {
  updateProgress();
  renderTracker();
  renderRoadmap();
  renderGuides();
}

function populateKinds() {
  for (const kind of kindDefinitions) {
    const option = document.createElement('option');
    option.value = kind.key;
    option.textContent = kind.label;
    kindFilter.append(option);
  }
}

function loadProgress() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    const values = Array.isArray(stored) ? stored : stored?.earned;
    if (!Array.isArray(values)) throw new Error('Stored progress is not a checklist.');
    const knownIds = new Set(trophies.map((trophy) => trophy.id));
    const knownNames = new Map(trophies.map((trophy) => [trophy.name, trophy.id]));
    earned = new Set(values.map((value) => typeof value === 'number' ? value : knownNames.get(value)).filter((id) => knownIds.has(id)));
  } catch {
    earned = new Set();
    showMessage('Saved progress could not be read; starting with an empty checklist.', true);
  }
}

function importProgress(file) {
  file.text().then((text) => {
    const parsed = JSON.parse(text);
    const values = Array.isArray(parsed) ? parsed : parsed?.earned;
    if (!Array.isArray(values)) throw new Error('Choose a VICE TRACKER JSON checklist export.');
    const knownIds = new Set(trophies.map((trophy) => trophy.id));
    const knownNames = new Map(trophies.map((trophy) => [trophy.name, trophy.id]));
    const imported = values.map((value) => typeof value === 'number' ? value : knownNames.get(value)).filter((id) => knownIds.has(id));
    if (values.length > 0 && imported.length === 0) throw new Error('No trophy IDs in that file match this list.');
    earned = new Set(imported);
    saveProgress();
    render();
    showMessage(`Imported ${earned.size} earned ${earned.size === 1 ? 'trophy' : 'trophies'}.`);
  }).catch((error) => showMessage(error.message || 'That file could not be imported.', true));
}

function exportProgress() {
  const payload = {
    game: 'Grand Theft Auto VI',
    platform: 'PlayStation 5',
    exportedAt: new Date().toISOString(),
    earned: [...earned].sort((a, b) => a - b),
  };
  const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'vice-tracker-progress.json';
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showMessage('Checklist exported as JSON.');
}

async function start() {
  try {
    const response = await fetch('data/trophies.json');
    if (!response.ok) throw new Error(`Trophy data could not be loaded (${response.status}).`);
    const data = await response.json();
    if (!Array.isArray(data.trophies) || data.trophies.length !== 55) throw new Error('The trophy data is incomplete; expected all 55 trophies.');
    trophies = data.trophies.map((trophy) => ({ ...trophy, kind: kindFor(trophy) }));
    loadProgress();
    spoilerToggle.checked = showSpoilers;
    populateKinds();
    render();
  } catch (error) {
    showMessage(error.message || 'The offline trophy list could not be loaded.', true);
  }
}

document.querySelector('#export').addEventListener('click', exportProgress);
document.querySelector('#import-file').addEventListener('change', (event) => {
  const [file] = event.target.files;
  if (file) importProgress(file);
  event.target.value = '';
});
gradeFilter.addEventListener('change', renderTracker);
kindFilter.addEventListener('change', renderTracker);
search.addEventListener('input', renderTracker);
spoilerToggle.addEventListener('change', () => {
  showSpoilers = spoilerToggle.checked;
  localStorage.setItem(SPOILER_KEY, String(showSpoilers));
  render();
});

start();
