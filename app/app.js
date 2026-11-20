const PROGRESS_KEY = 'vice-tracker-progress-v1';
const SPOILER_KEY = 'vice-tracker-spoilers-v1';
const REVEALED_KEY = 'vice-tracker-revealed-v1';
const $ = (selector) => document.querySelector(selector);
const params = new URLSearchParams(location.search);
const tracker = $('#tracker-list');
const roadmap = $('#roadmap-list');
const guides = $('#guide-list');
const feedback = $('#feedback');

const missableNotes = {
  34: 'The condition can be missed if the three shop robberies are not back-to-back, or if your Wanted Level is lost before they are complete.',
  36: 'The condition can be missed if five enemies are not taken down during a single use of Combat Focus.',
  37: 'The trophy calls for an unscheduled departure at VCIA; a scheduled departure does not meet that stated condition.',
  39: 'The condition can be missed if you are detected while robbing the jewelry store.',
};

const guideAdvice = {
  1: 'Treat the platinum as the final checkmark: this list says it is awarded for earning the other 54 trophies.',
  2: 'Start with Gone Fishing. The list identifies it as the opening mission.',
  3: 'Move through the story until Chapter 1 is complete.',
  4: 'Complete Chapter 2 to add this story trophy to the collection.',
  5: 'Chapter 3 is the full requirement here; finish it to unlock the trophy.',
  6: 'Finish Chapter 4 for this story milestone.',
  7: 'Save the final mission for the story’s end, then complete it for the gold trophy.',
  8: 'Complete Breakfast Run, the mission named in the requirement.',
  9: 'Finish The Cartel Heist to earn this mission trophy.',
  10: 'Child’s Play is the only stated requirement: complete that mission.',
  11: 'Complete the Headliners mission for DWNFALL.',
  12: 'Complete VCIA Takedown to check off Hi-Jacked.',
  13: 'Operation Savage Glory is the mission to complete for Snow Storm.',
  14: 'Build toward full completion across the game; the stated target is 100%.',
  15: 'Keep at the stunt count until 250 stunts have been completed.',
  16: 'Try each of the nine activity types once; variety, rather than repetition, is the stated goal.',
  17: 'The requirement covers every Shooting Range challenge: earn a gold medal in all 42.',
  18: 'Win a Top Fun Drone Race at each of its 14 locations.',
  19: 'The races must be different: win 20 distinct races.',
  20: 'Beat Cal in a fishing challenge to earn Baited My Tackle.',
  21: 'Complete one arcade game; the list does not require more than one.',
  22: 'Complete Andy’s final mission for Road to Rehabilitation.',
  23: 'Finish Kenton’s final mission to unlock This Was No Boat Accident.',
  24: 'The Lone Rider asks for Billy’s final mission; complete it.',
  25: 'Complete eight mission strands for strangers across the state of Leonida.',
  26: 'Finish Randy’s final mission for Supply & Demand.',
  27: 'Complete Tyrone’s final mission to earn Spin On This!',
  28: 'Meditate at all 18 spots across Leonida; the trophy is for visiting every listed spot.',
  29: 'Hunt the unique animal for Bret, as the trophy and guide specify.',
  30: 'Complete three Collectible Card sets for Don’t Touch My Deck.',
  31: 'Use WAiNK It at 100 locations to reach the listed total.',
  32: 'Complete 50 challenges to earn One Last Thing.',
  33: 'Reach a four-star Wanted Level with your partner, then lose it and escape the heat.',
  34: 'Rob three shops back-to-back with your partner while keeping your Wanted Level.',
  35: 'Discover vehicles until your total reaches 100.',
  36: 'Use Combat Focus and take down five enemies within that single use.',
  37: 'Make an unscheduled departure at VCIA; that specific kind of departure is the requirement.',
  38: 'Take on the Rhino tanks. The supplied trophy text gives no count or location, so do not assume an unstated target.',
  39: 'Rob a jewelry store without being detected to satisfy Sneakthief.',
  40: 'Rob five Bank Vaults and escape; both the five-vault count and escape are part of the requirement.',
  41: 'Rob an Armored Truck and escape to earn A Classic Blitz Play.',
  42: 'Explore all 52 areas of Leonida to complete The Goodtime State.',
  43: 'Rob an Illegal Operation belonging to each of the nine gangs.',
  44: 'Have a cocktail with a view on Ocean Beach, exactly as the trophy asks.',
  45: 'The requirement is to smash your way out of a vehicle showroom in classic style.',
  46: 'Follow through at the Kolt & Associates’ bowling alley by playing bowling there.',
  47: 'The requirement is a partnership with mass appeal, but the list names no action or threshold. Treat it as open-ended rather than assuming a specific activity.',
  48: 'Make in-game choices; no particular choice is named. The supplied guide notes PSN tracks a count to 500.',
  49: 'Succeed on a second attempt at the relevant task. The trophy text does not identify which task, so the list offers no more specific setup.',
  50: 'Witness an unusual event. The trophy text does not name a particular event or location.',
  51: 'Use a melee drive-by to knock someone down.',
  52: 'Launder $250,000 in Marked Bills through your contacts.',
  53: 'Spend $100,000 across all shops; the total spend is the requirement.',
  54: 'Purchase all eight garage properties to earn Little Boxes.',
  55: 'Register 10 vehicles to the Scooter Bros app.',
};

const phases = [
  { title: 'Follow the story', description: 'Clear the opening, chapter milestones and named missions.', ids: [2,3,4,5,6,7,8,9,10,11,12,13] },
  { title: 'Meet the people of Leonida', description: 'Finish stranger strands, character missions and the listed personal moments.', ids: [22,23,24,25,26,27,29,44,47,48,49,50] },
  { title: 'Explore, play & collect', description: 'Mix up activities, discover the state and work through collectible goals.', ids: [16,18,19,20,21,28,30,31,32,35,42,46,55] },
  { title: 'Take on the challenges', description: 'Make progress on skill tests, criminal jobs and the specific high-pressure conditions.', ids: [15,17,33,34,36,37,38,39,40,41,43,45,51,52,53] },
  { title: 'Close out the platinum', description: 'Finish the 100% milestone, remaining property purchases and the final award.', ids: [14,54,1] },
];

const descriptionsById = new Map();
let trophies = [];
let earned = new Set(readStoredArray(PROGRESS_KEY).map(String));
let revealed = new Set(readStoredArray(REVEALED_KEY).map(Number));
let spoilersRevealed = readStoredValue(SPOILER_KEY) === 'true';
let noticeTimer;
let storageWarningShown = false;

function readStoredValue(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function readStoredArray(key) {
  try {
    const value = JSON.parse(readStoredValue(key) ?? '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function classify(trophy) {
  const text = `${trophy.description} ${trophy.guide}`.toLowerCase();
  if (/chapter|mission|stranger strand|final mission|opening mission/.test(text)) return 'story';
  if (/collectible|card set/.test(text)) return 'collectible';
  if (/challenge|stunt|shooting range|medal|combat focus/.test(text)) return 'challenge';
  if (/rob |rob a|rob  |robbery|vault|wanted level|launder|marked bills|vehicle showroom|melee drive-by/.test(text)) return 'crime';
  if (/explore|areas of leonida|discover 100 vehicles|meditate|spots across/.test(text)) return 'exploration';
  if (/activity|race|fishing|arcade|drone|bowling|wa[iy]nk|scooter bros/.test(text)) return 'activities';
  if (/cocktail|partnership|choices|second try|something strange|unique animal|garage propert|100% completion|earn the other 54 trophies/.test(text)) return 'milestones';
  return 'activities';
}

function isStory(trophy) {
  return classify(trophy) === 'story';
}

function isEarned(trophy) {
  return earned.has(String(trophy.id)) || earned.has(trophy.name);
}

function isVisible(trophy) {
  return spoilersRevealed || !isStory(trophy) || isEarned(trophy) || revealed.has(trophy.id);
}

function make(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function gradeBadge(grade) {
  return make('span', `grade-badge grade-${grade}`, grade);
}

function flag() {
  return make('span', 'missable', 'MISSABLE');
}

function renderProgress() {
  const count = trophies.filter(isEarned).length;
  const others = trophies.filter((trophy) => trophy.grade !== 'platinum').length;
  const earnedOthers = trophies.filter((trophy) => trophy.grade !== 'platinum' && isEarned(trophy)).length;
  const percent = Math.round((count / trophies.length) * 100);
  $('#progress-count').textContent = `${count} / ${trophies.length} earned`;
  $('#progress-percent').textContent = `${percent}%`;
  $('#overall-meter').style.width = `${percent}%`;
  $('#platinum-count').textContent = `${earnedOthers} / ${others} other trophies`;
  $('#platinum-meter').style.width = `${Math.round((earnedOthers / others) * 100)}%`;
  $('.meter[aria-label="All trophies earned"]').setAttribute('aria-valuenow', String(count));
  $('.meter[aria-label="Progress towards the platinum"]').setAttribute('aria-valuenow', String(earnedOthers));
  $('#platinum-note').textContent = earned.has('1') || earned.has('Vice Got a Price!')
    ? 'Platinum earned. Leonida is yours.'
    : earnedOthers === others
      ? 'All 54 other trophies are earned — the platinum is within reach.'
      : 'Earn the other 54 trophies to complete the set.';
}

function createTrophyCard(trophy) {
  const card = make('article', `trophy-card${isEarned(trophy) ? ' is-earned' : ''}`);
  const checkWrap = make('label', 'check-wrap');
  const checkbox = make('input', 'trophy-check');
  checkbox.type = 'checkbox';
  checkbox.checked = isEarned(trophy);
  checkbox.setAttribute('aria-label', `Mark ${isVisible(trophy) ? trophy.name : 'story spoiler'} as earned`);
  checkbox.addEventListener('change', () => {
    const key = String(trophy.id);
    if (checkbox.checked) {
      earned.add(key);
      revealed.add(trophy.id);
      persistRevealed();
    } else {
      earned.delete(key);
      earned.delete(trophy.name);
    }
    saveProgress();
    renderAll();
  });
  checkWrap.append(checkbox);

  const copy = make('div', 'trophy-copy');
  const titleLine = make('div', 'trophy-title-line');
  const hidden = !isVisible(trophy);
  titleLine.append(make('span', 'trophy-id', `#${String(trophy.id).padStart(2, '0')}`));
  if (hidden) {
    const spoiler = make('span', 'spoiler-cover');
    spoiler.append(make('span', '', 'Story spoiler hidden'));
    const reveal = make('button', 'reveal-one', 'Reveal');
    reveal.type = 'button';
    reveal.addEventListener('click', () => revealTrophy(trophy));
    spoiler.append(reveal);
    titleLine.append(spoiler);
  } else {
    titleLine.append(make('h3', 'trophy-title', trophy.name));
  }
  copy.append(titleLine);
  if (!hidden) copy.append(make('p', 'description', trophy.description));

  const meta = make('div', 'card-meta');
  meta.append(gradeBadge(trophy.grade), make('span', 'kind-chip', classify(trophy)));
  if (missableNotes[trophy.id]) meta.append(flag());
  card.append(checkWrap, copy, meta);
  return card;
}

function renderTracker() {
  const query = $('#search').value.trim().toLocaleLowerCase();
  const grade = $('#grade-filter').value;
  const kind = $('#kind-filter').value;
  const filtered = trophies.filter((trophy) => {
    const matchesText = !query || [trophy.name, trophy.description, trophy.guide, guideAdvice[trophy.id], classify(trophy)]
      .some((value) => value.toLocaleLowerCase().includes(query));
    return matchesText && (grade === 'all' || trophy.grade === grade) && (kind === 'all' || classify(trophy) === kind);
  });
  tracker.replaceChildren(...filtered.map(createTrophyCard));
  $('#results-count').textContent = `${filtered.length} ${filtered.length === 1 ? 'trophy' : 'trophies'}`;
  $('#empty-state').hidden = filtered.length !== 0;
}

function renderRoadmap() {
  roadmap.replaceChildren();
  for (const [index, phase] of phases.entries()) {
    const section = make('section', 'phase');
    const head = make('div', 'phase-head');
    const heading = make('div', 'phase-heading');
    heading.append(make('span', 'phase-number', String(index + 1)));
    const text = make('div');
    text.append(make('h3', '', phase.title), make('p', '', phase.description));
    heading.append(text);
    head.append(heading, make('span', 'phase-count', `${phase.ids.length} TROPHIES`));
    const list = make('div', 'phase-trophies');
    for (const id of phase.ids) {
      const trophy = descriptionsById.get(id);
      const item = make('div', 'road-trophy');
      const left = make('div', 'road-trophy-left');
      left.append(make('span', 'road-id', `#${String(id).padStart(2, '0')}`));
      left.append(make('span', `road-name${!isVisible(trophy) ? ' story-hidden' : ''}`, isVisible(trophy) ? trophy.name : 'Story spoiler hidden'));
      const meta = make('div', 'road-meta');
      if (missableNotes[id]) meta.append(flag());
      meta.append(gradeBadge(trophy.grade));
      item.append(left, meta);
      list.append(item);
    }
    section.append(head, list);
    roadmap.append(section);
  }
}

function createGuide(trophy) {
  const hidden = !isVisible(trophy);
  const details = make('details', 'guide-card');
  details.dataset.trophyId = String(trophy.id);
  const summary = make('summary');
  const titleWrap = make('span', 'guide-title-wrap');
  titleWrap.append(make('span', 'trophy-id', `#${String(trophy.id).padStart(2, '0')}`));
  titleWrap.append(make('span', 'trophy-title', hidden ? 'Story spoiler hidden' : trophy.name));
  if (missableNotes[trophy.id]) titleWrap.append(flag());
  summary.append(titleWrap, gradeBadge(trophy.grade));
  details.append(summary);

  const body = make('div', 'guide-body');
  if (hidden) {
    const prompt = make('div', 'spoiler-cover');
    prompt.append(make('span', '', 'Reveal this story trophy to read its guide.'));
    const reveal = make('button', 'reveal-one', 'Reveal');
    reveal.type = 'button';
    reveal.addEventListener('click', () => revealTrophy(trophy));
    prompt.append(reveal);
    body.append(prompt);
  } else {
    body.append(make('p', 'guide-requirement', `Official requirement: ${trophy.description}`));
    body.append(make('p', 'guide-advice', guideAdvice[trophy.id]));
    if (missableNotes[trophy.id]) {
      const note = make('p', 'missable-note');
      note.append(make('strong', '', 'When it can be missed: '), document.createTextNode(missableNotes[trophy.id]));
      body.append(note);
    }
    body.append(make('p', 'source-line', 'Source: official trophy list bundled in app/data/trophies.json.'));
  }
  details.append(body);
  return details;
}

function renderGuides() {
  const query = $('#guide-search').value.trim().toLocaleLowerCase();
  const filtered = trophies.filter((trophy) => !query ||
    [trophy.name, trophy.description, trophy.guide, guideAdvice[trophy.id], classify(trophy)]
      .some((value) => value.toLocaleLowerCase().includes(query)));
  guides.replaceChildren(...filtered.map(createGuide));
  $('#guide-empty').hidden = filtered.length !== 0;
  const selected = params.get('guide');
  if (selected) {
    const match = guides.querySelector(`[data-trophy-id="${CSS.escape(selected)}"]`);
    if (match && (params.get('expand') || selected)) {
      match.open = true;
      if (params.get('expand')) match.scrollIntoView({ block: 'center', behavior: 'instant' });
    }
  }
}

function revealTrophy(trophy) {
  revealed.add(trophy.id);
  persistRevealed();
  renderAll();
}

function saveProgress() {
  writeStoredValue(PROGRESS_KEY, JSON.stringify([...earned]));
}

function persistRevealed() {
  writeStoredValue(REVEALED_KEY, JSON.stringify([...revealed]));
}

function writeStoredValue(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    if (!storageWarningShown) {
      storageWarningShown = true;
      announce('Progress is available for this session, but this browser could not save it.');
    }
  }
}

function renderAll() {
  renderProgress();
  renderTracker();
  renderRoadmap();
  renderGuides();
}

function showView(name) {
  for (const view of ['tracker', 'roadmap', 'guides']) {
    $(`#${view}-view`).hidden = view !== name;
    const tab = document.querySelector(`.tab[data-view="${view}"]`);
    tab.classList.toggle('active', view === name);
    if (view === name) tab.setAttribute('aria-current', 'page');
    else tab.removeAttribute('aria-current');
  }
}

function announce(message) {
  feedback.textContent = message;
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => { feedback.textContent = ''; }, 4500);
}

function setKinds() {
  const kinds = [...new Set(trophies.map(classify))].sort();
  for (const kind of kinds) {
    const option = make('option', '', kind[0].toUpperCase() + kind.slice(1));
    option.value = kind;
    $('#kind-filter').append(option);
  }
}

function setInitialView() {
  const view = params.get('view');
  if (view === 'roadmap' || view === 'guides') showView(view);
  else showView('tracker');
  if (params.get('search')) $('#search').value = params.get('search');
  if (params.get('grade')) $('#grade-filter').value = params.get('grade');
  if (params.get('kind')) $('#kind-filter').value = params.get('kind');
  if (params.get('spoilers') === '1') {
    spoilersRevealed = true;
    writeStoredValue(SPOILER_KEY, 'true');
  }
  $('#spoiler-setting').checked = spoilersRevealed;
}

$('#spoiler-setting').addEventListener('change', (event) => {
  spoilersRevealed = event.target.checked;
  writeStoredValue(SPOILER_KEY, String(spoilersRevealed));
  renderAll();
});
$('#search').addEventListener('input', renderTracker);
$('#grade-filter').addEventListener('change', renderTracker);
$('#kind-filter').addEventListener('change', renderTracker);
$('#guide-search').addEventListener('input', renderGuides);
$('#clear-filters').addEventListener('click', () => {
  $('#search').value = '';
  $('#grade-filter').value = 'all';
  $('#kind-filter').value = 'all';
  renderTracker();
});
document.querySelectorAll('.tab').forEach((tab) => tab.addEventListener('click', () => showView(tab.dataset.view)));

$('#export').addEventListener('click', () => {
  const data = { format: 'vice-tracker-progress-v1', exportedAt: new Date().toISOString(), earned: [...earned].map(String) };
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const link = make('a');
  link.href = url;
  link.download = 'vice-tracker-progress.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  announce('Progress exported as JSON.');
});
$('#import').addEventListener('change', async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const values = Array.isArray(data) ? data : data?.earned;
    if (!Array.isArray(values)) throw new Error('The JSON must contain an earned trophy list.');
    const valid = new Set(trophies.flatMap((trophy) => [String(trophy.id), trophy.name]));
    const imported = values.map(String).filter((value) => valid.has(value));
    if (imported.length !== values.length) throw new Error('The file includes entries that are not in the official trophy list.');
    earned = new Set(imported);
    for (const trophy of trophies) {
      if (isEarned(trophy)) revealed.add(trophy.id);
    }
    saveProgress();
    persistRevealed();
    renderAll();
    announce(`Imported ${earned.size} earned ${earned.size === 1 ? 'trophy' : 'trophies'}.`);
  } catch (error) {
    announce(error instanceof Error ? `Import failed: ${error.message}` : 'Import failed: invalid JSON.');
  } finally {
    event.target.value = '';
  }
});

try {
  const response = await fetch('data/trophies.json');
  if (!response.ok) throw new Error(`Trophy data request failed (${response.status}).`);
  const data = await response.json();
  if (!Array.isArray(data.trophies) || data.trophies.length !== 55) throw new Error('The official trophy list must contain exactly 55 trophies.');
  trophies = data.trophies;
  for (const trophy of trophies) descriptionsById.set(trophy.id, trophy);
  setKinds();
  const phaseIds = phases.flatMap((phase) => phase.ids);
  if (phaseIds.length !== trophies.length || new Set(phaseIds).size !== trophies.length || trophies.some((trophy) => !phaseIds.includes(trophy.id))) {
    throw new Error('The roadmap must include each trophy exactly once.');
  }
  setInitialView();
  if (params.get('view') === 'roadmap') $('#roadmap-view').scrollIntoView({ behavior: 'instant' });
  if (params.get('view') === 'guides') $('#guides-view').scrollIntoView({ behavior: 'instant' });
  if (params.get('grade')) $('#grade-filter').value = params.get('grade');
  renderAll();
} catch (error) {
  announce(error instanceof Error ? error.message : 'Unable to load the official trophy list.');
  console.error(error);
}
