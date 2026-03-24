const API = '';

const CLASS_ICONS = {
  Scholar: '📜', Warrior: '⚔️', Merchant: '💰', Monk: '🪷', Hermit: '🌿'
};

const UPGRADE_DEFS = {
  silver_boost:    { name: 'Trade Connections',    desc: 'Silver +25%/lv',   maxLevel: 5 },
  knowledge_boost: { name: 'Imperial Library',     desc: 'Knowledge +25%/lv', maxLevel: 5 },
  supplies_boost:  { name: 'Military Stockpile',   desc: 'Supplies +25%/lv', maxLevel: 5 },
  qi_boost:        { name: 'Meditation Retreat',   desc: 'Qi +25%/lv',       maxLevel: 5 },
  stealth_cloak:   { name: 'Shadow Technique',     desc: 'Visibility -20%/lv', maxLevel: 3 },
  fortification:   { name: 'Hidden Fortress',      desc: 'Dmg taken -15%/lv', maxLevel: 3 },
  trade_network:   { name: 'Secret Trade Network', desc: 'Passive silver',   maxLevel: 2 },
};

const UPGRADE_COSTS = {
  silver_boost:    { silver: 100, knowledge: 0,  supplies: 0,  qi: 0  },
  knowledge_boost: { silver: 50,  knowledge: 50, supplies: 0,  qi: 0  },
  supplies_boost:  { silver: 75,  knowledge: 0,  supplies: 25, qi: 0  },
  qi_boost:        { silver: 30,  knowledge: 20, supplies: 0,  qi: 30 },
  stealth_cloak:   { silver: 80,  knowledge: 40, supplies: 0,  qi: 20 },
  fortification:   { silver: 120, knowledge: 0,  supplies: 80, qi: 0  },
  trade_network:   { silver: 200, knowledge: 50, supplies: 50, qi: 0  },
};

let state = {
  playerId: localStorage.getItem('mingPlayerId') || null,
  player: null,
  regions: [],
  leaderboard: [],
  worldEvents: [],
  recentEvents: [],
  selectedClass: null,
  refreshInterval: null,
};

// ===== INIT =====
window.addEventListener('DOMContentLoaded', () => {
  setupCreationScreen();
  if (state.playerId) {
    loadPlayer(state.playerId);
  }
});

function setupCreationScreen() {
  // Class selection
  document.querySelectorAll('.class-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.class-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      state.selectedClass = card.dataset.class;
      document.getElementById('create-btn').disabled = false;
    });
  });

  document.getElementById('create-btn').addEventListener('click', createPlayer);
  document.getElementById('load-btn').addEventListener('click', () => {
    const id = document.getElementById('existing-id').value.trim();
    if (id) loadPlayer(id);
  });

  document.getElementById('player-name').addEventListener('keydown', e => {
    if (e.key === 'Enter') createPlayer();
  });
}

async function createPlayer() {
  const name = document.getElementById('player-name').value.trim();
  const errEl = document.getElementById('creation-error');
  errEl.textContent = '';

  if (!name) { errEl.textContent = 'Please enter a name.'; return; }
  if (!state.selectedClass) { errEl.textContent = 'Please select a class.'; return; }

  try {
    const res = await fetch(`${API}/api/players`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, characterClass: state.selectedClass }),
    });
    const data = await res.json();
    if (!res.ok) { errEl.textContent = data.error || 'Error creating player.'; return; }

    localStorage.setItem('mingPlayerId', data.id);
    state.playerId = data.id;
    state.player = data;
    addEventEntry('collect', `Welcome, ${data.name} the ${data.class}! The Dark Forest awaits.`);
    showGameScreen();
  } catch (e) {
    errEl.textContent = 'Server error. Try again.';
  }
}

async function loadPlayer(id) {
  try {
    const res = await fetch(`${API}/api/players/${id}`);
    if (!res.ok) {
      document.getElementById('creation-error').textContent = 'Player not found.';
      return;
    }
    const data = await res.json();
    localStorage.setItem('mingPlayerId', data.id);
    state.playerId = data.id;
    state.player = data;
    addEventEntry('collect', `Welcome back, ${data.name}!`);
    showGameScreen();
  } catch (e) {
    document.getElementById('creation-error').textContent = 'Server error.';
  }
}

// ===== SCREEN MANAGEMENT =====
function showGameScreen() {
  document.getElementById('creation-screen').classList.add('hidden');
  document.getElementById('game-screen').classList.remove('hidden');

  updateUI();
  loadWorldData();

  if (state.refreshInterval) clearInterval(state.refreshInterval);
  state.refreshInterval = setInterval(autoRefresh, 10000);

  document.getElementById('logout-btn').addEventListener('click', logout);
  document.getElementById('collect-btn').addEventListener('click', collectResources);
  document.getElementById('copy-id-btn').addEventListener('click', () => {
    navigator.clipboard.writeText(state.playerId).then(() => {
      document.getElementById('copy-id-btn').textContent = 'Copied!';
      setTimeout(() => { document.getElementById('copy-id-btn').textContent = 'Copy ID'; }, 2000);
    });
  });

  document.querySelectorAll('.stance-btn').forEach(btn => {
    btn.addEventListener('click', () => setStance(btn.dataset.stance));
  });

  document.getElementById('revive-btn').addEventListener('click', revivePlayer);
  document.getElementById('new-char-btn').addEventListener('click', () => {
    document.getElementById('death-overlay').classList.add('hidden');
    logout();
  });

  document.getElementById('player-id-display').textContent = state.playerId;
}

function logout() {
  clearInterval(state.refreshInterval);
  localStorage.removeItem('mingPlayerId');
  state.playerId = null;
  state.player = null;
  document.getElementById('game-screen').classList.add('hidden');
  document.getElementById('creation-screen').classList.remove('hidden');
}

// ===== AUTO REFRESH =====
async function autoRefresh() {
  if (!state.playerId) return;
  try {
    const [playerRes, worldRes] = await Promise.all([
      fetch(`${API}/api/players/${state.playerId}`),
      fetch(`${API}/api/world`),
    ]);
    if (playerRes.ok) {
      state.player = await playerRes.json();
    }
    if (worldRes.ok) {
      const world = await worldRes.json();
      state.regions = world.regions;
      state.worldEvents = world.activeEvents;
      state.recentEvents = world.recentEvents;
    }
    const lbRes = await fetch(`${API}/api/world/leaderboard`);
    if (lbRes.ok) state.leaderboard = await lbRes.json();
    updateUI();
  } catch (e) { /* silent */ }
}

async function loadWorldData() {
  try {
    const [worldRes, lbRes] = await Promise.all([
      fetch(`${API}/api/world`),
      fetch(`${API}/api/world/leaderboard`),
    ]);
    if (worldRes.ok) {
      const world = await worldRes.json();
      state.regions = world.regions;
      state.worldEvents = world.activeEvents;
      state.recentEvents = world.recentEvents;
    }
    if (lbRes.ok) state.leaderboard = await lbRes.json();
    updateUI();
  } catch (e) { /* silent */ }
}

// ===== UI UPDATE =====
function updateUI() {
  const p = state.player;
  if (!p) return;

  // Header
  document.getElementById('header-player').textContent = `${p.name} · Lv ${p.level}`;
  document.getElementById('header-region').textContent = p.region;

  // Character panel
  document.getElementById('char-icon').textContent = CLASS_ICONS[p.class] || '?';
  document.getElementById('char-name').textContent = p.name;
  document.getElementById('char-class').textContent = `${p.class} · K/D ${p.kills}/${p.deaths}`;
  document.getElementById('char-level').textContent = `Level ${p.level}`;

  const hpPct = Math.max(0, Math.min(100, (p.health / p.maxHealth) * 100));
  document.getElementById('health-bar').style.width = hpPct + '%';
  document.getElementById('health-text').textContent = `${p.health}/${p.maxHealth}`;

  const xpPct = Math.max(0, Math.min(100, (p.xp % p.xpForNextLevel) / p.xpForNextLevel * 100));
  document.getElementById('xp-bar').style.width = xpPct + '%';
  document.getElementById('xp-text').textContent = `${p.xp} / ${p.xp + p.xpForNextLevel}`;

  document.getElementById('stat-attack').textContent = p.attack;
  document.getElementById('stat-defense').textContent = p.defense;
  document.getElementById('stat-wisdom').textContent = p.wisdom;
  document.getElementById('stat-stealth').textContent = p.stealth;

  // Visibility
  document.getElementById('vis-desc').textContent = p.visibilityDescription;
  document.getElementById('vis-val').textContent = p.visibility + '%';
  document.getElementById('vis-bar').style.width = p.visibility + '%';

  // Status
  document.getElementById('char-status').textContent = p.alive
    ? `⚡ Active in ${p.region}`
    : '☠ Fallen';

  // Stance buttons
  document.querySelectorAll('.stance-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.stance === p.stance);
  });

  // Resources
  document.getElementById('res-silver').textContent = fmt(p.resources.silver);
  document.getElementById('res-knowledge').textContent = fmt(p.resources.knowledge);
  document.getElementById('res-supplies').textContent = fmt(p.resources.supplies);
  document.getElementById('res-qi').textContent = fmt(p.resources.qi);

  // Regions
  renderRegions();

  // World events banner
  renderWorldEventsBanner();

  // Upgrades
  renderUpgrades();

  // Leaderboard
  renderLeaderboard();

  // Death overlay
  if (!p.alive) {
    document.getElementById('death-overlay').classList.remove('hidden');
    document.getElementById('death-message').textContent = 'You have been defeated in the Dark Forest.';
    document.getElementById('revive-cost').textContent = `Revival costs ${p.level * 50} silver. You have ${fmt(p.resources.silver)} silver.`;
  } else {
    document.getElementById('death-overlay').classList.add('hidden');
  }
}

function fmt(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return Number(n).toFixed(1);
}

function renderRegions() {
  const container = document.getElementById('region-grid');
  if (!state.regions.length) return;
  const p = state.player;

  container.innerHTML = state.regions.map(r => {
    const isCurrent = p && r.name === p.region;
    const threatClass = r.threatLevel.toLowerCase().replace(' ', '');
    return `
      <div class="region-card ${isCurrent ? 'current' : ''}" data-region="${r.name}">
        <div class="region-icon">${r.icon}</div>
        <div class="region-info">
          <div class="region-name">${r.name}</div>
          <div class="region-desc">${r.description}</div>
        </div>
        <span class="region-threat threat-${threatClass}">${r.threatLevel}</span>
        <span class="region-players">👤${r.playerCount}</span>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.region-card').forEach(card => {
    card.addEventListener('click', () => {
      const regionName = card.dataset.region;
      if (p && regionName !== p.region) moveToRegion(regionName);
    });
  });
}

function renderWorldEventsBanner() {
  const banner = document.getElementById('world-events-banner');
  banner.innerHTML = state.worldEvents.slice(0, 3).map(e =>
    `<span class="event-badge">⚡ ${e.name}</span>`
  ).join('');
}

function renderUpgrades() {
  const p = state.player;
  if (!p) return;
  const container = document.getElementById('upgrades-list');

  container.innerHTML = Object.entries(UPGRADE_DEFS).map(([id, def]) => {
    const curLevel = (p.upgrades && p.upgrades[id]) || 0;
    const isMax = curLevel >= def.maxLevel;
    const cost = UPGRADE_COSTS[id];
    const costMult = Math.pow(2, curLevel);
    const canAfford = !isMax &&
      p.resources.silver >= cost.silver * costMult &&
      p.resources.knowledge >= cost.knowledge * costMult &&
      p.resources.supplies >= cost.supplies * costMult &&
      p.resources.qi >= cost.qi * costMult;

    const costStr = Object.entries(cost)
      .filter(([, v]) => v > 0)
      .map(([k, v]) => `${v * costMult} ${k}`)
      .join(', ');

    return `
      <div class="upgrade-card">
        <div class="upgrade-header">
          <span class="upgrade-name">${def.name}</span>
          <span class="upgrade-level">${curLevel}/${def.maxLevel}</span>
        </div>
        <div class="upgrade-desc">${def.desc}</div>
        ${!isMax ? `<div class="upgrade-cost">Cost: ${costStr}</div>` : ''}
        <button class="upgrade-btn ${isMax ? 'maxed' : ''}" data-upgrade="${id}" ${isMax || !canAfford ? 'disabled' : ''}>
          ${isMax ? 'MAX' : canAfford ? 'Upgrade' : 'Need resources'}
        </button>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.upgrade-btn:not(:disabled)').forEach(btn => {
    btn.addEventListener('click', () => purchaseUpgrade(btn.dataset.upgrade));
  });
}

function renderLeaderboard() {
  const container = document.getElementById('leaderboard-list');
  if (!state.leaderboard.length) {
    container.innerHTML = '<div style="color:var(--text-dim);font-size:0.75rem">No entries yet</div>';
    return;
  }

  container.innerHTML = state.leaderboard.slice(0, 10).map((entry, i) => {
    const rankClass = i === 0 ? 'top1' : i === 1 ? 'top2' : i === 2 ? 'top3' : '';
    const rankSymbol = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1);
    const isSelf = entry.player_id === state.playerId;
    return `
      <div class="lb-entry ${isSelf ? 'lb-self' : ''}">
        <span class="lb-rank ${rankClass}">${rankSymbol}</span>
        <span class="lb-name">${entry.player_name}</span>
        <span class="lb-class">${entry.player_class}</span>
        <span class="lb-score">${entry.score}</span>
      </div>
    `;
  }).join('');
}

// ===== ACTIONS =====
async function setStance(stance) {
  await playerAction({ action: stance });
  state.player = { ...state.player, stance };
  updateUI();
}

async function moveToRegion(regionName) {
  const result = await playerAction({ action: 'move', regionName });
  if (result && result.success) {
    addEventEntry('action', result.message);
    const playerRes = await fetch(`${API}/api/players/${state.playerId}`);
    if (playerRes.ok) { state.player = await playerRes.json(); updateUI(); }
  }
}

async function collectResources() {
  try {
    const res = await fetch(`${API}/api/players/${state.playerId}/collect`);
    const data = await res.json();
    if (res.ok) {
      state.player = data;
      const c = data.collected;
      addEventEntry('collect',
        `Collected: 🪙${fmt(c.silver)} 📚${fmt(c.knowledge)} 🎒${fmt(c.supplies)} ☯️${fmt(c.qi)}`
      );
      updateUI();
    }
  } catch (e) { /* silent */ }
}

async function purchaseUpgrade(upgradeId) {
  const result = await playerAction({ action: 'upgrade', upgradeId });
  if (result && result.success) {
    addEventEntry('action', result.message);
    const playerRes = await fetch(`${API}/api/players/${state.playerId}`);
    if (playerRes.ok) { state.player = await playerRes.json(); updateUI(); }
  }
}

async function revivePlayer() {
  const result = await playerAction({ action: 'revive' });
  if (result && result.success) {
    addEventEntry('collect', result.message);
    const playerRes = await fetch(`${API}/api/players/${state.playerId}`);
    if (playerRes.ok) { state.player = await playerRes.json(); updateUI(); }
  }
}

async function playerAction(body) {
  try {
    const res = await fetch(`${API}/api/players/${state.playerId}/action`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      addEventEntry('threat', data.error || 'Action failed');
      return null;
    }
    return data;
  } catch (e) {
    return null;
  }
}

// ===== EVENT LOG =====
const localEvents = [];

function addEventEntry(type, message) {
  localEvents.unshift({ type, message, time: Date.now() });
  if (localEvents.length > 50) localEvents.pop();
  renderEventLog();
}

function renderEventLog() {
  const log = document.getElementById('event-log');
  const events = [...localEvents];

  // Merge server recent events
  if (state.recentEvents) {
    state.recentEvents.forEach(e => {
      const typeMap = { threat_encounter: 'threat', player_death: 'death', pvp_kill: 'pvp', action: 'action' };
      events.push({ type: typeMap[e.type] || 'action', message: e.message, time: e.createdAt * 1000 });
    });
  }

  events.sort((a, b) => b.time - a.time);

  log.innerHTML = events.slice(0, 30).map(e =>
    `<div class="event-entry ${e.type || ''}">${e.message}</div>`
  ).join('');
}
