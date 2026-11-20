const STORAGE_KEY = 'vice-tracker-progress-v1';
const SPOILER_KEY = 'vice-tracker-spoilers-v1';
const SOURCE_LINE = 'Source: Official Grand Theft Auto VI trophy list bundled in app/data/trophies.json.';

const elements = {
  trophyList: document.querySelector('#trophy-list'),
  roadmapList: document.querySelector('#roadmap-list'),
  guideList: document.querySelector('#guide-list'),
  status: document.querySelector('#status-message'),
  grade: document.querySelector('#grade-filter'),
  kind: document.querySelector('#kind-filter'),
  search: document.querySelector('#search'),
  spoiler: document.querySelector('#spoiler-toggle'),
};
const kinds = [
  { key: 'story', label: 'Story & missions' },
  { key: 'activities', label: 'Activities' },
  { key: 'challenge', label: 'Challenges' },
  { key: 'collectibles', label: 'Collectibles' },
  { key: 'exploration', label: 'Exploration' },
  { key: 'crime', label: 'Crime & combat' },
  { key: 'lifestyle', label: 'Lifestyle & other' },
];
const phases = [
  { title: 'The story spine & watch-outs', subtitle: 'Start with the campaign; keep missables in view', note: 'Clear the listed campaign milestones in sequence and note the single-run conditions before moving on. Story details remain concealed until revealed or earned.' },
  { title: 'People, pastimes & skill', subtitle: 'Take the side roads', note: 'Work through the listed character strands and activity requirements; the trophy list does not state unlock timing.' },
  { title: 'Leonida, collected', subtitle: 'Sweep the wider map', note: 'Use each trophy’s own stated count as your checklist; no locations beyond those named in the list are assumed.' },
  { title: 'Heat, hustle & oddities', subtitle: 'Finish the specific conditions', note: 'Handle crime, lifestyle and unusual one-off requirements, paying attention to the visible missable flags.' },
  { title: 'The final ledger', subtitle: 'Close the completion check', note: 'Reach the stated 100% completion milestone, complete the final mission, then claim the platinum for the other 54 trophies.' },
];
const guideNotes = {
  1: 'Keep this as the final stamp on the checklist: its guide line makes the other 54 trophies the full requirement.',
  2: 'The opening milestone is specific: complete Gone Fishing, the first mission named in the requirement.',
  3: 'Use Chapter 1 as the target; this trophy asks for the chapter to be complete.',
  4: 'The checklist names Chapter 2. Finish that chapter to clear this campaign milestone.',
  5: 'Complete Chapter 3 for this story trophy; the chapter number is the full stated condition.',
  6: 'Move through Chapter 4 to its completion point to satisfy this milestone.',
  7: 'Save the final mission requirement for the campaign’s closing stretch, then complete it.',
  8: 'Breakfast Run is the named target: complete that mission to earn Trust.',
  9: 'The Cartel Heist is the complete requirement here. Finish that specific mission.',
  10: 'Complete Child’s Play; no additional condition is listed for this mission trophy.',
  11: 'Headliners is the named mission. Complete it to check off DWNFALL.',
  12: 'Complete VCIA Takedown to fulfill the full stated requirement.',
  13: 'Operation Savage Glory is the mission to finish for Snow Storm.',
  14: 'Treat 100% completion as the end-of-route audit: the stated target is full completion.',
  15: 'Build the total to 250 completed stunts; this is a cumulative count.',
  16: 'Try each activity type once. The guide line gives the checklist total as nine types.',
  17: 'The requirement is gold in every Shooting Range challenge; the guide line specifies all 42.',
  18: 'Win a Top Fun Drone Race at every location; the guide line calls out 14 locations.',
  19: 'The target is 20 different race wins, so track distinct races rather than repeating one.',
  20: 'Beat Cal in a fishing challenge; the list does not add another condition.',
  21: 'Finish an arcade game. One completed game is the stated target.',
  22: 'Complete Andy’s final mission to finish this character-specific milestone.',
  23: 'Kenton’s final mission is the requirement; finish it for this trophy.',
  24: 'Complete Billy’s final mission to clear The Lone Rider.',
  25: 'Complete eight mission strands for strangers across Leonida; the count is strands, not individual missions.',
  26: 'Finish Randy’s final mission to meet Supply & Demand’s requirement.',
  27: 'Complete Tyrone’s final mission to earn Spin On This!',
  28: 'Meditate at every spot; the guide line sets the total at 18.',
  29: 'Hunt the unique animal for Bret. The requirement does not specify another animal or count.',
  30: 'Complete three Collectible Card sets; the listed guide repeats that exact set total.',
  31: 'Use WAiNK It at 100 locations. Track the location count against the stated target.',
  32: 'Complete 50 challenges to reach the listed total.',
  33: 'Have your partner with you for a four-star Wanted Level, then lose it and escape the heat.',
  34: 'Keep the three-shop sequence together: rob them back-to-back with your partner and do not lose the Wanted Level.',
  35: 'Discover vehicles until the total reaches 100.',
  36: 'During one use of Combat Focus, take down five enemies; the single-use condition is essential.',
  37: 'The named event is an unscheduled departure at VCIA; the trophy text gives no further steps.',
  38: 'The description identifies Rhinos as the subject. Its guide clarifies that these are tanks.',
  39: 'Rob a jewelry store without being detected. Avoid detection for the full stated condition.',
  40: 'Rob five Bank Vaults and escape; keep the total to the five-vault target.',
  41: 'Rob an Armored Truck and escape to satisfy both parts of the requirement.',
  42: 'Explore all of Leonida; the guide line gives the target as 52 areas.',
  43: 'Rob an Illegal Operation belonging to each gang. The guide line gives nine gangs total.',
  44: 'Enjoy a cocktail with a view on Ocean Beach; both details come directly from the requirement.',
  45: 'Smash your way out of a vehicle showroom in the classic style named by the trophy.',
  46: 'Follow through at the Kolt & Associates’ bowling alley; the guide identifies it as playing bowling there.',
  47: 'The stated clue is a partnership with mass appeal. The bundled guide does not specify a more exact action.',
  48: 'The requirement points to choices. The bundled guide says PlayStation tracks a count to 500.',
  49: 'The clue is success on a second try. Keep that exact retry condition in mind.',
  50: 'Witness something strange; the description frames the moment as an unexpected surprise.',
  51: 'Use a melee drive-by to bowl someone over; both the move and result are in the requirement.',
  52: 'Earn $250,000 by laundering Marked Bills through your contacts; track the stated amount.',
  53: 'Spend $100,000 across all shops. The total is cumulative across the shop category.',
  54: 'Purchase all garage properties; the guide line gives the complete count as eight.',
  55: 'Register ten vehicles to the Scooter Bros app to hit the listed total.',
};

function kindFor(trophy) {
  const text = `${trophy.description} ${trophy.guide}`.toLowerCase();
  if (/complete (gone fishing|chapter \d+|the final mission|breakfast run|the cartel heist|child's play|headliners|vcia takedown|operation savage glory)|final mission for|mission strands for strangers/.test(text)) return 'story';
  if (/collectible|card sets/.test(text)) return 'collectibles';
  if (/shooting range|stunt|challenge/.test(text)) return 'challenge';
  if (/wanted level|rob |rob\b|escape the heat|enemies|combat focus|bank vault|jewelry store|illegal operation|gang|rhino|armored truck|smash your way out|melee drive-by|unscheduled departure|launder|marked bills/.test(text)) return 'crime';
  if (/explore|areas of leonida|discover \d+ vehicles|locations|spots across/.test(text)) return 'exploration';
  if (/activity|drone race|races|fishing challenge|arcade game|meditate|hunt a unique|waink|bowling|bow 'em over/.test(text)) return 'activities';
  return 'lifestyle';
}

function phaseFor(trophy) {
  if (trophy.id === 1 || trophy.id === 7 || trophy.id === 14) return 4;
  if (trophy.missableWindow) return 0;
  if (trophy.kind === 'story' && trophy.id < 22) return 0;
  if (trophy.kind === 'story' || trophy.kind === 'activities' || trophy.kind === 'challenge') return 1;
  if (trophy.kind === 'collectibles' || trophy.kind === 'exploration') return 2;
  return 3;
}

function missableWindow(trophy) {
  switch (trophy.id) {
    case 34: return 'The run depends on robbing 3 shops back-to-back without losing your Wanted Level.';
    case 36: return 'The requirement is five takedowns in a single use of Combat Focus.';
    case 37: return 'The trophy calls for an unscheduled departure at VCIA.';
    case 39: return 'The robbery must be completed without being detected.';
    case 49: return 'Its description calls for success on the second try.';
    default: return '';
  }
}

function makeElement(tag, className = '', text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function message(text, isError = false) {
  elements.status.textContent = text;
  elements.status.classList.toggle('error', isError);
  elements.status.classList.add('visible');
  clearTimeout(message.timer);
  message.timer = setTimeout(() => elements.status.classList.remove('visible'), 3200);
}

function saveProgress() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...earned]));
  } catch {
    message('Progress could not be saved in this browser.', true);
  }
}

function isHidden(trophy) {
  return trophy.kind === 'story' && !showSpoilers && !earned.has(trophy.id);
}

function badge(grade) {
  return makeElement('span', `grade-badge grade-${grade}`, grade);
}

function appendMissable(parent, trophy) {
  if (trophy.missableWindow) parent.append(makeElement('span', 'missable-badge', 'Missable'));
}

function appendGuide(parent, trophy) {
  const copy = makeElement('p', 'field-guide-copy', guideNotes[trophy.id] || trophy.guide);
  parent.append(copy);
  if (trophy.missableWindow) {
    const when = makeElement('p', 'missable-window');
    when.append(makeElement('strong', '', 'When it can be missed: '), document.createTextNode(trophy.missableWindow));
    parent.append(when);
  }
  parent.append(makeElement('p', 'guide-citation', SOURCE_LINE));
}

function makeEarnControl(trophy, hidden = false, compact = false) {
  const label = makeElement('label', compact ? 'earned-control compact-earned' : 'earned-control');
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = earned.has(trophy.id);
  checkbox.setAttribute('aria-label', hidden ? `Mark concealed story trophy ${trophy.id} as earned` : `Mark ${trophy.name} as earned`);
  checkbox.addEventListener('change', () => {
    if (checkbox.checked) earned.add(trophy.id);
    else earned.delete(trophy.id);
    saveProgress();
    render();
  });
  label.append(checkbox);
  return label;
}

function makeTrophyCard(trophy) {
  const hidden = isHidden(trophy);
  const article = makeElement('article', `trophy-card${earned.has(trophy.id) ? ' is-earned' : ''}`);
  const main = makeElement('div', 'trophy-main');
  const title = makeElement('div', 'title-line');
  title.append(makeElement('span', 'trophy-number', String(trophy.id).padStart(2, '0')));
  title.append(makeElement('h3', hidden ? 'spoiler-text' : '', hidden ? 'Story trophy hidden' : trophy.name));
  const description = makeElement('p', `trophy-description${hidden ? ' spoiler-text' : ''}`,
    hidden ? 'Reveal story spoilers or earn this trophy to see its requirement.' : trophy.description);
  const tags = makeElement('div', 'trophy-tags');
  tags.append(badge(trophy.grade), makeElement('span', 'kind-tag', kinds.find((kind) => kind.key === trophy.kind).label));
  appendMissable(tags, trophy);
  main.append(title, description, tags);
  article.append(makeEarnControl(trophy, hidden), main);
  if (hidden) main.append(makeElement('span', 'hidden-hint', 'Guide hidden'));
  else {
    const details = makeElement('details', 'guide-details');
    if (initialQuery.get('expand') === String(trophy.id)) details.open = true;
    details.append(makeElement('summary', '', 'Open field guide'));
    appendGuide(details, trophy);
    main.append(details);
  }
  return article;
}

function updateProgress() {
  const total = trophies.length;
  const count = earned.size;
  const percentage = Math.round(count / total * 100);
  const platinum = trophies.find((trophy) => trophy.grade === 'platinum');
  const nonPlatinumCount = trophies.filter((trophy) => trophy.grade !== 'platinum' && earned.has(trophy.id)).length;
  document.querySelector('#earned-count').textContent = String(count);
  document.querySelector('#progress-percent').textContent = `${percentage}%`;
  document.querySelector('#progress-fill').style.width = `${percentage}%`;
  document.querySelector('.progress-track').setAttribute('aria-valuenow', String(count));
  document.querySelector('#remaining-count').textContent = `${total - count} REMAINING`;
  document.querySelector('#platinum-progress').textContent = `${nonPlatinumCount} / 54 other trophies`;
  document.querySelector('#platinum-status').textContent = earned.has(platinum.id) ? 'UNLOCKED' : nonPlatinumCount === 54 ? 'READY' : 'IN SIGHT';
}

function renderTracker() {
  elements.trophyList.replaceChildren();
  const query = elements.search.value.trim().toLocaleLowerCase();
  const visible = trophies.filter((trophy) => {
    if (elements.grade.value !== 'all' && trophy.grade !== elements.grade.value) return false;
    if (elements.kind.value !== 'all' && trophy.kind !== elements.kind.value) return false;
    if (!query) return true;
    if (isHidden(trophy)) return false;
    return `${trophy.name} ${trophy.description} ${guideNotes[trophy.id]}`.toLocaleLowerCase().includes(query);
  });
  for (const trophy of visible) elements.trophyList.append(makeTrophyCard(trophy));
  document.querySelector('#shown-count').textContent = String(visible.length);
  document.querySelector('#empty-state').hidden = visible.length > 0;
}

function makeRoadmapCard(trophy) {
  const hidden = isHidden(trophy);
  const article = makeElement('article', `roadmap-card${earned.has(trophy.id) ? ' is-earned' : ''}`);
  const check = document.createElement('input');
  check.type = 'checkbox';
  check.className = 'roadmap-check';
  check.checked = earned.has(trophy.id);
  check.setAttribute('aria-label', hidden ? `Mark concealed story trophy ${trophy.id} as earned` : `Mark ${trophy.name} as earned`);
  check.addEventListener('change', () => {
    if (check.checked) earned.add(trophy.id);
    else earned.delete(trophy.id);
    saveProgress();
    render();
  });
  const info = makeElement('div', 'roadmap-info');
  info.append(makeElement('h4', hidden ? 'spoiler-text' : '', hidden ? 'Story trophy hidden' : trophy.name));
  info.append(makeElement('p', hidden ? 'spoiler-text' : '', hidden ? 'Reveal spoilers to view this requirement.' : trophy.description));
  const meta = makeElement('div', 'roadmap-meta');
  meta.append(badge(trophy.grade), makeElement('span', 'kind-tag', kinds.find((kind) => kind.key === trophy.kind).label));
  appendMissable(meta, trophy);
  info.append(meta);
  article.append(check, info);
  return article;
}

function renderRoadmap() {
  elements.roadmapList.replaceChildren();
  phases.forEach((phase, index) => {
    const section = makeElement('section', 'roadmap-phase');
    const items = trophies.filter((trophy) => phaseFor(trophy) === index);
    const heading = makeElement('div', 'phase-heading');
    const title = makeElement('div', 'phase-title');
    title.append(makeElement('h3', '', phase.title), makeElement('p', '', phase.subtitle));
    heading.append(makeElement('span', 'phase-marker', String(index + 1).padStart(2, '0')), title, makeElement('span', 'phase-count', `${items.length} TROPHIES`));
    const list = makeElement('div', 'phase-trophies');
    for (const trophy of items) list.append(makeRoadmapCard(trophy));
    section.append(heading, makeElement('p', 'phase-note', phase.note), list);
    elements.roadmapList.append(section);
  });
}

function renderGuides() {
  elements.guideList.replaceChildren();
  const guideId = initialQuery.get('guide');
  const selected = guideId ? trophies.filter((trophy) => String(trophy.id) === guideId) : trophies;
  for (const trophy of selected) {
    const hidden = isHidden(trophy);
    const item = makeElement('article', 'field-guide-item');
    const heading = makeElement('div', 'field-guide-heading');
    heading.append(makeElement('span', 'trophy-number', String(trophy.id).padStart(2, '0')));
    heading.append(makeElement('h3', hidden ? 'spoiler-text' : '', hidden ? 'Story trophy hidden' : trophy.name), badge(trophy.grade));
    appendMissable(heading, trophy);
    item.append(heading);
    if (hidden) item.append(makeElement('p', 'hidden-hint', 'Requirement and guide hidden while story spoilers are off.'));
    else {
      item.append(makeElement('p', 'field-guide-requirement', trophy.description));
      const details = makeElement('details', 'field-guide-detail');
      if (initialQuery.get('expand') === String(trophy.id)) details.open = true;
      details.append(makeElement('summary', '', 'Open field guide'));
      appendGuide(details, trophy);
      item.append(details);
    }
    elements.guideList.append(item);
  }
}

function render() {
  updateProgress();
  renderTracker();
  renderRoadmap();
  renderGuides();
}

function setView(view) {
  const valid = ['tracker', 'roadmap', 'guides'].includes(view) ? view : 'tracker';
  for (const button of document.querySelectorAll('.view-tab')) {
    const active = button.dataset.view === valid;
    button.classList.toggle('active', active);
    button.setAttribute('aria-selected', String(active));
  }
  for (const section of document.querySelectorAll('.view-section')) section.hidden = section.id !== `${valid}-view`;
}

function parseEarned(value) {
  const values = Array.isArray(value) ? value : value && Array.isArray(value.earned) ? value.earned : null;
  if (!values) throw new Error('Choose a VICE TRACKER JSON progress export.');
  const knownIds = new Set(trophies.map((trophy) => trophy.id));
  const knownNames = new Map(trophies.map((trophy) => [trophy.name, trophy.id]));
  const ids = values.map((entry) => typeof entry === 'number' ? entry : knownNames.get(entry)).filter((id) => knownIds.has(id));
  if (values.length > 0 && ids.length === 0) throw new Error('No trophy IDs in that file match this list.');
  return new Set(ids);
}

const response = await fetch('data/trophies.json');
if (!response.ok) throw new Error(`Trophy data could not be loaded (${response.status}).`);
const data = await response.json();
if (!Array.isArray(data.trophies) || data.trophies.length !== 55) throw new Error('The bundled trophy list must contain 55 trophies.');
const trophies = data.trophies.map((trophy) => ({ ...trophy, kind: kindFor(trophy), missableWindow: missableWindow(trophy) }));
const initialQuery = new URLSearchParams(location.search);
let earned = new Set();
let showSpoilers = localStorage.getItem(SPOILER_KEY) === 'true' || initialQuery.get('spoilers') === '1';
try {
  earned = parseEarned(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'));
} catch {
  earned = new Set();
}
elements.spoiler.checked = showSpoilers;
for (const kind of kinds) {
  const option = document.createElement('option');
  option.value = kind.key;
  option.textContent = kind.label;
  elements.kind.append(option);
}
elements.search.value = initialQuery.get('search') ?? '';
elements.grade.value = initialQuery.get('grade') ?? 'all';
elements.kind.value = initialQuery.get('kind') ?? 'all';
for (const button of document.querySelectorAll('.view-tab')) button.addEventListener('click', () => setView(button.dataset.view));
elements.spoiler.addEventListener('change', () => {
  showSpoilers = elements.spoiler.checked;
  localStorage.setItem(SPOILER_KEY, String(showSpoilers));
  render();
});
elements.search.addEventListener('input', renderTracker);
elements.grade.addEventListener('change', renderTracker);
elements.kind.addEventListener('change', renderTracker);
document.querySelector('#export-button').addEventListener('click', () => {
  const payload = JSON.stringify({ version: 1, game: data.game, earned: [...earned].sort((a, b) => a - b) }, null, 2);
  const url = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'vice-tracker-progress.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  message('Progress export downloaded.');
});
document.querySelector('#import-file').addEventListener('change', async (event) => {
  const [file] = event.target.files;
  if (!file) return;
  try {
    earned = parseEarned(JSON.parse(await file.text()));
    saveProgress();
    render();
    message(`Imported ${earned.size} earned ${earned.size === 1 ? 'trophy' : 'trophies'}.`);
  } catch (error) {
    message(error.message || 'That progress file could not be imported.', true);
  } finally {
    event.target.value = '';
  }
});
setView(initialQuery.get('view'));
render();
