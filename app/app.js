const STORAGE_KEY = 'vice-tracker-progress';
const SPOILER_KEY = 'vice-tracker-story-spoilers';
const SOURCE = 'Source: official trophy list bundled in app/data/trophies.json.';

const guideNotes = {
  1: 'Treat this as the capstone: earn the other 54 trophies in this list to become a Leonida Legend.',
  2: 'Clear Gone Fishing, the opening mission named in the guide, to start the story sequence.',
  3: 'Finish Chapter 1; this trophy is tied directly to that chapter milestone.',
  4: 'Complete Chapter 2 to add this story milestone to the collection.',
  5: 'Reach the end of Chapter 3 for this Vice City story trophy.',
  6: 'Complete Chapter 4 to check off the last numbered chapter in the list.',
  7: 'Finish the final mission. The official list marks this story finish as gold.',
  8: 'Complete Breakfast Run, the mission named in the trophy requirement.',
  9: 'Finish The Cartel Heist to earn this mission trophy.',
  10: 'Complete Child’s Play; the trophy is awarded for that mission.',
  11: 'Finish Headliners to check off this mission entry.',
  12: 'Complete VCIA Takedown, as named in the requirement.',
  13: 'Finish Operation Savage Glory for this mission trophy.',
  14: 'Work toward the full completion target: this trophy requires 100% completion.',
  15: 'Keep completing stunts until the total reaches 250.',
  16: 'Give every activity type a try; the guide specifies nine types in total.',
  17: 'Earn gold medals across all 42 Shooting Range challenges to meet the full requirement.',
  18: 'Win a Top Fun drone race at each of the 14 locations.',
  19: 'Build a record of 20 different race wins; repeats do not add a different race.',
  20: 'Beat Cal in a fishing challenge to earn this activity trophy.',
  21: 'Complete one arcade game; a single finished game satisfies the listed target.',
  22: 'Complete Andy’s final mission, the milestone named in the requirement.',
  23: 'Finish Kenton’s final mission for this character-specific trophy.',
  24: 'Complete Billy’s final mission to check off this entry.',
  25: 'Complete eight mission strands for strangers across Leonida.',
  26: 'Finish Randy’s final mission for this character-specific trophy.',
  27: 'Complete Tyrone’s final mission to earn this entry.',
  28: 'Meditate at all 18 spots across Leonida; the requirement covers every spot.',
  29: 'Hunt the unique animal for Bret, as specified by the trophy.',
  30: 'Complete three Collectible Card sets to reach the listed total.',
  31: 'Use WAiNK It at 100 locations to reach the location target.',
  32: 'Complete 50 challenges; keep going until the total reaches the requirement.',
  33: 'With your partner, lose a four-star Wanted Level and escape the heat.',
  34: 'Keep the three shop robberies back-to-back with your partner, without losing the Wanted Level.',
  35: 'Discover vehicles until the total reaches 100.',
  36: 'During one use of Combat Focus, take down five enemies to satisfy the single-use requirement.',
  37: 'Make an unscheduled departure at VCIA; the trophy specifically calls for an unscheduled one.',
  38: 'The bundled note identifies Rhinos as tanks but gives no count or action; use the trophy’s Rhino-related requirement as your target.',
  39: 'Rob a jewelry store without being detected; remaining undetected is part of the requirement.',
  40: 'Rob five Bank Vaults and escape to complete both parts of the requirement.',
  41: 'Rob an Armored Truck and escape to finish this crime requirement.',
  42: 'Explore all 52 areas of Leonida; the guide gives the count behind “all.”',
  43: 'Rob one Illegal Operation for each of the nine gangs.',
  44: 'Enjoy a cocktail with a view on Ocean Beach, as the trophy describes.',
  45: 'Smash your way out of a vehicle showroom in the classic style named by the trophy.',
  46: 'Follow-through at the Kolt & Associates’ bowling alley to earn this entry.',
  47: 'Complete the partnership-related milestone described as having mass appeal; the list gives no activity or location.',
  48: 'Keep making choices as you progress. The bundled note says PSN tracks a 500-count, though the trophy text does not say which choices count.',
  49: 'This calls for success on a second attempt. Neither the trophy text nor its guide note names the activity, so repeat the relevant attempt and succeed on try two.',
  50: 'The entry asks you to witness something strange but names no event or location; look for the unusual encounter that triggers the trophy.',
  51: 'Use a melee drive-by to knock someone down, combining both parts of the requirement.',
  52: 'Launder marked bills through your contacts until the total earned reaches $250,000.',
  53: 'Spend $100,000 across all shops to meet the cumulative amount.',
  54: 'Purchase every garage property; the bundled guide specifies eight in total.',
  55: 'Register 10 vehicles to the Scooter Bros app to reach the listed target.'
};

const missables = {
  34: 'It can be missed if the three shop robberies are not back-to-back or the Wanted Level is lost.',
  36: 'It can be missed during a single use of Combat Focus if fewer than five enemies are taken down.',
  37: 'It can be missed if the departure at VCIA is not unscheduled.',
  39: 'It can be missed during the jewelry store robbery if you are detected.'
};

const phases = [
  { title: 'The main story', note: 'Clear the chapters and named story missions.', ids: [2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13, 7] },
  { title: 'People and side stories', note: 'Follow the character missions, stranger strands, and story moments.', ids: [22, 23, 24, 25, 26, 27, 29, 47, 48, 49, 50] },
  { title: 'Activities and competition', note: 'Mix in challenges, races, activities, and local pastimes.', ids: [15, 16, 17, 18, 19, 20, 21, 28, 31, 32, 38, 44, 46] },
  { title: 'Explore and collect', note: 'Fill out Leonida and finish the collection-based goals.', ids: [30, 35, 42, 54, 55] },
  { title: 'Crime and platinum cleanup', note: 'Finish the remaining crime, spending, completion, and capstone goals.', ids: [33, 34, 36, 37, 39, 40, 41, 43, 45, 51, 52, 53, 14, 1] }
];

const status = document.getElementById('status');
const trackerList = document.getElementById('tracker-list');
const roadmapList = document.getElementById('roadmap-list');
const guideList = document.getElementById('guide-list');
const searchInput = document.getElementById('search');
const gradeFilter = document.getElementById('grade-filter');
const kindFilter = document.getElementById('kind-filter');
const spoilerToggle = document.getElementById('spoiler-toggle');
let trophies = [];
let earned = new Set();
let revealed = false;

function announce(message, isError = false) {
  status.textContent = message;
  status.classList.toggle('error', isError);
}

function kindOf(trophy) {
  const text = `${trophy.description} ${trophy.guide}`.toLowerCase();
  if (/chapter|mission|stranger strand/.test(text)) return 'Story';
  if (/collectible|card set|garage propert|register .*vehicles/.test(text)) return 'Collectible';
  if (/challenge|stunt|shooting range|race/.test(text)) return 'Challenge';
  if (/rob |rob an|rob 5|robbery|wanted level|combat focus|detected|vehicle showroom|melee drive-by/.test(text)) return 'Crime';
  if (/explore|areas of leonida|locations|activity|fishing|hunt |arcade|cocktail|bowling|rhinos|tanks|departure at vcia/.test(text)) return 'Activities';
  if (/spend \\$|launder|marked bills|earn \\$/.test(text)) return 'Money';
  if (/100% completion|other 54/.test(text)) return 'Completion';
  return 'Moments';
}

function validIds(values) {
  if (!Array.isArray(values)) throw new Error('Progress must contain a list of earned trophies.');
  const byName = new Map(trophies.map((trophy) => [trophy.name, trophy.id]));
  const ids = new Set();
  for (const value of values) {
    const id = typeof value === 'string' ? byName.get(value) : value;
    if (!Number.isInteger(id) || !trophies.some((trophy) => trophy.id === id)) {
      throw new Error('Progress contains an unknown trophy. No progress was changed.');
    }
    ids.add(id);
  }
  return ids;
}

function loadProgress() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === null) return new Set();
    return validIds(JSON.parse(saved));
  } catch (error) {
    announce(`Saved progress could not be read: ${error.message}`, true);
    return new Set();
  }
}

function saveProgress() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...earned].sort((a, b) => a - b)));
    announce('Progress saved on this device.');
    return true;
  } catch (error) {
    announce(`Progress could not be saved: ${error.message}`, true);
    return false;
  }
}

function gradeClass(grade) {
  return `grade-${grade}`;
}

function badge(trophy) {
  return `<span class="grade-badge ${gradeClass(trophy.grade)}">${trophy.grade}</span>`;
}

function kindBadge(trophy) {
  return `<span class="kind-badge">${kindOf(trophy)}</span>`;
}

function missableBadge(trophy) {
  return missables[trophy.id] ? '<span class="missable-badge">Missable</span>' : '';
}

function storyHidden(trophy) {
  return kindOf(trophy) === 'Story' && !revealed && !earned.has(trophy.id);
}

function safeText(value) {
  const span = document.createElement('span');
  span.textContent = value;
  return span.innerHTML;
}

function matchingTrophies() {
  const query = searchInput.value.trim().toLocaleLowerCase();
  return trophies.filter((trophy) => {
    const matchesGrade = gradeFilter.value === 'all' || trophy.grade === gradeFilter.value;
    const matchesKind = kindFilter.value === 'all' || kindOf(trophy) === kindFilter.value;
    const searchable = `${trophy.name} ${trophy.description} ${trophy.guide} ${guideNotes[trophy.id]} ${kindOf(trophy)}`.toLocaleLowerCase();
    return matchesGrade && matchesKind && (!query || searchable.includes(query));
  });
}

function numberBadge(trophy) {
  return `<span class="number-badge" aria-label="Trophy position ${trophy.id}">${trophy.id}</span>`;
}

function checkboxMarkup(trophy) {
  const checked = earned.has(trophy.id) ? ' checked' : '';
  return `<label class="earned-toggle"><input type="checkbox" data-earned="${trophy.id}"${checked}><span>Earned</span></label>`;
}

function missableLine(trophy) {
  const when = missables[trophy.id];
  return when ? `<p class="missable-line"><strong>When it can be missed</strong>${safeText(when)}</p>` : '';
}

function renderProgress() {
  const total = trophies.length;
  const totalEarned = earned.size;
  const platinumTotal = trophies.filter((trophy) => trophy.grade !== 'platinum').length;
  const platinumEarned = [...earned].filter((id) => trophies.find((trophy) => trophy.id === id)?.grade !== 'platinum').length;
  document.getElementById('overall-count').textContent = `${totalEarned} / ${total}`;
  document.getElementById('platinum-count').textContent = `${platinumEarned} / ${platinumTotal}`;
  document.getElementById('overall-bar').style.width = `${total ? totalEarned / total * 100 : 0}%`;
  document.getElementById('platinum-bar').style.width = `${platinumTotal ? platinumEarned / platinumTotal * 100 : 0}%`;
}

function renderTracker(matches) {
  trackerList.replaceChildren();
  for (const trophy of matches) {
    const hidden = storyHidden(trophy);
    const card = document.createElement('article');
    card.className = `trophy-card${earned.has(trophy.id) ? ' earned' : ''}`;
    card.innerHTML = `${numberBadge(trophy)}<div class="card-body">
      <div class="card-topline"><h3 class="trophy-name">${hidden ? 'Story trophy · details hidden' : safeText(trophy.name)}</h3>${badge(trophy)}</div>
      <div class="card-meta">${kindBadge(trophy)}${missableBadge(trophy)}</div>
      <p class="trophy-description">${hidden ? 'Reveal story spoilers or earn this trophy to see its details.' : safeText(trophy.description)}</p>
      ${hidden ? '' : `<p class="trophy-guide">${safeText(guideNotes[trophy.id])}</p>`}
      ${missableLine(trophy)}
      <div class="card-actions">${checkboxMarkup(trophy)}</div>
    </div>`;
    trackerList.append(card);
  }
  document.getElementById('result-count').textContent = `${matches.length} ${matches.length === 1 ? 'trophy' : 'trophies'}`;
  if (!matches.length) trackerList.innerHTML = '<div class="empty-state" role="status">No trophies match those filters.</div>';
}

function renderRoadmap(matches) {
  const available = new Set(matches.map((trophy) => trophy.id));
  const compact = new URLSearchParams(location.search).get('compact') === '1';
  roadmapList.replaceChildren();
  document.getElementById('roadmap-count').textContent = `${matches.length} ${matches.length === 1 ? 'milestone' : 'milestones'}`;
  phases.forEach((phase, index) => {
    const members = phase.ids.filter((id) => available.has(id)).map((id) => trophies.find((trophy) => trophy.id === id));
    if (!members.length) return;
    const section = document.createElement('details');
    section.className = 'phase';
    section.open = !compact || index === 0 || index === phases.length - 1;
    const rows = members.map((trophy) => {
      const hidden = storyHidden(trophy);
      return `<div class="roadmap-row">${numberBadge(trophy)}<div class="roadmap-copy">
        <strong>${hidden ? 'Story trophy · details hidden' : safeText(trophy.name)}</strong>
        <span>${hidden ? 'Reveal story spoilers or earn this trophy to see its details.' : safeText(trophy.description)}</span>
        ${missables[trophy.id] ? `<span class="missable-line"><strong>When it can be missed</strong>${safeText(missables[trophy.id])}</span>` : ''}
      </div><div class="card-meta">${badge(trophy)}${missableBadge(trophy)}</div></div>`;
    }).join('');
    section.innerHTML = `<summary class="phase-heading"><span class="phase-number">${index + 1}</span><div><h3>${safeText(phase.title)}</h3><p>${safeText(phase.note)}</p></div></summary><div class="roadmap-rows">${rows}</div>`;
    roadmapList.append(section);
  });
  if (!matches.length) roadmapList.innerHTML = '<div class="empty-state" role="status">No roadmap milestones match those filters.</div>';
}

function renderGuides(matches) {
  guideList.replaceChildren();
  for (const trophy of matches) {
    const hidden = storyHidden(trophy);
    const detailsOpen = new URLSearchParams(location.search).get('guide') === String(trophy.id) && new URLSearchParams(location.search).get('expand') === '1';
    const card = document.createElement('article');
    card.className = 'guide-card';
    card.innerHTML = `<div class="guide-main">${numberBadge(trophy)}<div class="guide-content">
      <div class="guide-title-row"><h3>${hidden ? 'Story trophy · details hidden' : safeText(trophy.name)}</h3>${badge(trophy)}${kindBadge(trophy)}${missableBadge(trophy)}</div>
      <p class="guide-advice">${hidden ? 'Reveal story spoilers or earn this trophy to see its guide.' : safeText(guideNotes[trophy.id])}</p>
      ${hidden ? '' : `<details class="guide-details"${detailsOpen ? ' open' : ''}><summary>Official requirement and missable timing</summary><p>${safeText(trophy.description)}</p><p>Official guide note: ${safeText(trophy.guide)}</p>${missables[trophy.id] ? `<p class="missable-line"><strong>When it can be missed</strong>${safeText(missables[trophy.id])}</p>` : ''}</details>`}
      <p class="source-line">${SOURCE}</p>
    </div></div>`;
    guideList.append(card);
  }
  document.getElementById('guide-count').textContent = `${matches.length} ${matches.length === 1 ? 'entry' : 'entries'}`;
  if (!matches.length) guideList.innerHTML = '<div class="empty-state" role="status">No guides match those filters.</div>';
}

function render() {
  const matches = matchingTrophies();
  renderProgress();
  renderTracker(matches);
  renderRoadmap(matches);
  renderGuides(matches);
  document.querySelectorAll('[data-earned]').forEach((input) => {
    input.addEventListener('change', () => {
      const id = Number(input.dataset.earned);
      if (input.checked) earned.add(id);
      else earned.delete(id);
      saveProgress();
      render();
    });
  });
}

function switchView(name) {
  document.querySelectorAll('.tab').forEach((tab) => {
    const selected = tab.dataset.view === name;
    tab.classList.toggle('active', selected);
    if (selected) tab.setAttribute('aria-current', 'page');
    else tab.removeAttribute('aria-current');
  });
  document.querySelectorAll('.view-panel').forEach((panel) => {
    panel.hidden = panel.id !== `${name}-view`;
  });
}

function populateKinds() {
  const kinds = [...new Set(trophies.map(kindOf))].sort((a, b) => a.localeCompare(b));
  for (const kind of kinds) {
    const option = document.createElement('option');
    option.value = kind;
    option.textContent = kind;
    kindFilter.append(option);
  }
}

function configureFromUrl() {
  const params = new URLSearchParams(location.search);
  if (params.has('search')) searchInput.value = params.get('search');
  if (['platinum', 'gold', 'silver', 'bronze'].includes(params.get('grade'))) gradeFilter.value = params.get('grade');
  const kind = params.get('kind');
  if ([...kindFilter.options].some((option) => option.value === kind)) kindFilter.value = kind;
  if (params.get('spoilers') === '1') {
    revealed = true;
    spoilerToggle.checked = true;
  } else {
    try {
      revealed = localStorage.getItem(SPOILER_KEY) === '1';
    } catch (error) {
      revealed = false;
      announce(`Story spoiler preference could not be read: ${error.message}`, true);
    }
    spoilerToggle.checked = revealed;
  }
  const view = params.get('view');
  if (['tracker', 'roadmap', 'guides'].includes(view)) switchView(view);
  if (params.has('search') && !view) switchView('tracker');
}

async function start() {
  try {
    const response = await fetch('data/trophies.json');
    if (!response.ok) throw new Error(`Trophy data could not be loaded (${response.status}).`);
    const data = await response.json();
    if (!Array.isArray(data.trophies) || data.trophies.length !== 55) throw new Error('The bundled trophy list must contain exactly 55 entries.');
    trophies = data.trophies;
    earned = loadProgress();
    populateKinds();
    configureFromUrl();
    switchView(new URLSearchParams(location.search).get('view') ?? 'tracker');
    render();
    document.querySelectorAll('.tab').forEach((tab) => tab.addEventListener('click', () => switchView(tab.dataset.view)));
    [searchInput, gradeFilter, kindFilter].forEach((control) => control.addEventListener('input', render));
    spoilerToggle.addEventListener('change', () => {
      revealed = spoilerToggle.checked;
      try {
        localStorage.setItem(SPOILER_KEY, revealed ? '1' : '0');
        announce(revealed ? 'Story spoilers revealed.' : 'Unearned story trophy details hidden.');
      } catch (error) {
        announce(`Spoiler preference could not be saved: ${error.message}`, true);
      }
      render();
    });
    document.getElementById('export').addEventListener('click', () => {
      const payload = JSON.stringify({ app: 'VICE TRACKER', version: 1, earned: [...earned].sort((a, b) => a - b) }, null, 2);
      const download = document.createElement('a');
      const url = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
      download.href = url;
      download.download = 'vice-tracker-progress.json';
      download.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      announce('Progress exported as JSON.');
    });
    document.getElementById('import').addEventListener('change', async (event) => {
      const file = event.target.files[0];
      if (!file) return;
      try {
        const parsed = JSON.parse(await file.text());
        const values = Array.isArray(parsed) ? parsed : parsed?.version === 1 && parsed.app === 'VICE TRACKER' ? parsed.earned : null;
        const imported = validIds(values);
        earned = imported;
        if (saveProgress()) announce(`Imported ${earned.size} earned trophies.`);
        render();
      } catch (error) {
        announce(`Import failed: ${error.message}`, true);
      } finally {
        event.target.value = '';
      }
    });
  } catch (error) {
    announce(`VICE TRACKER could not start: ${error.message}`, true);
    throw error;
  }
}

start();
