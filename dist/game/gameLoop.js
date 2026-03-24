"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runGameTick = runGameTick;
exports.startGameLoop = startGameLoop;
exports.stopGameLoop = stopGameLoop;
const database_1 = require("../db/database");
const idle_1 = require("./idle");
const darkForest_1 = require("./darkForest");
const character_1 = require("./character");
const world_1 = require("./world");
function runGameTick() {
    const db = (0, database_1.getDb)();
    const now = Math.floor(Date.now() / 1000);
    (0, world_1.triggerRandomWorldEvent)();
    const activeEvents = (0, world_1.getActiveWorldEvents)();
    const players = db.prepare('SELECT * FROM players WHERE alive = 1').all();
    const tickTransaction = db.transaction(() => {
        for (const player of players) {
            const upgrades = JSON.parse(player.upgrades || '{}');
            const elapsedSeconds = Math.min(now - player.last_tick, 300);
            if (elapsedSeconds < 5)
                continue;
            const resourceGain = (0, idle_1.calculateResourceTick)(player.class, player.level, player.stance, player.region, player.visibility, upgrades, elapsedSeconds);
            const eventMults = (0, world_1.getWorldEventMultipliers)(player.region, activeEvents);
            resourceGain.silver *= eventMults.silverMultiplier * eventMults.resourceMultiplier;
            resourceGain.knowledge *= eventMults.knowledgeMultiplier * eventMults.resourceMultiplier;
            resourceGain.xp = Math.floor(resourceGain.xp * eventMults.xpMultiplier);
            const newVisibility = (0, darkForest_1.updateVisibility)(player.visibility, player.stance, player.class, upgrades);
            const threatChance = (0, darkForest_1.calculateThreatChance)(newVisibility, player.stance, player.region, player.level) * eventMults.threatMultiplier;
            let newHealth = player.health;
            let bonusSilver = 0;
            let bonusXp = 0;
            let alive = 1;
            let deathMessage = '';
            if (Math.random() < threatChance * (elapsedSeconds / 30)) {
                const threat = (0, darkForest_1.selectThreat)(newVisibility);
                const encounter = (0, darkForest_1.resolveEncounter)(player.class, player.attack, player.defense, player.wisdom, player.stealth, newHealth, threat, upgrades);
                if (encounter.encountered) {
                    newHealth = Math.max(0, newHealth - (encounter.damageTaken || 0));
                    if (encounter.reward) {
                        bonusSilver += encounter.reward.silver;
                        bonusXp += encounter.reward.xp;
                    }
                    if (!encounter.survived || newHealth <= 0) {
                        alive = 0;
                        deathMessage = encounter.message;
                    }
                    db.prepare(`
            INSERT INTO events (type, message, player_id, data)
            VALUES (?, ?, ?, ?)
          `).run('threat_encounter', encounter.message, player.id, JSON.stringify({ threat: threat.name, damage: encounter.damageTaken }));
                }
            }
            const newXp = player.xp + resourceGain.xp + bonusXp;
            const newLevel = Math.min(50, (0, character_1.calculateLevel)(newXp));
            db.prepare(`
        UPDATE players SET
          silver = silver + ?,
          knowledge = knowledge + ?,
          supplies = supplies + ?,
          qi = qi + ?,
          xp = ?,
          level = ?,
          health = ?,
          visibility = ?,
          last_tick = ?,
          alive = ?
        WHERE id = ?
      `).run(resourceGain.silver + bonusSilver, resourceGain.knowledge, resourceGain.supplies, resourceGain.qi, newXp, newLevel, newHealth, newVisibility, now, alive, player.id);
            if (!alive) {
                db.prepare(`
          INSERT INTO events (type, message, player_id, data)
          VALUES ('player_death', ?, ?, ?)
        `).run(deathMessage, player.id, JSON.stringify({ killer: 'threat' }));
                db.prepare('UPDATE players SET deaths = deaths + 1 WHERE id = ?').run(player.id);
            }
            updateLeaderboardEntry(player.id, db);
        }
    });
    try {
        tickTransaction();
    }
    catch (err) {
        console.error('Game tick error:', err);
    }
}
function updateLeaderboardEntry(playerId, db) {
    const player = db.prepare('SELECT * FROM players WHERE id = ?').get(playerId);
    if (!player)
        return;
    const now = Math.floor(Date.now() / 1000);
    const survivalDays = Math.floor((now - 0) / 86400);
    const score = Math.floor(player.level * 100 +
        player.silver * 0.1 +
        player.kills * 50);
    db.prepare(`
    INSERT INTO leaderboard (player_id, player_name, player_class, level, total_silver, kills, survival_days, score, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(player_id) DO UPDATE SET
      player_name = excluded.player_name,
      player_class = excluded.player_class,
      level = excluded.level,
      total_silver = excluded.total_silver,
      kills = excluded.kills,
      survival_days = excluded.survival_days,
      score = excluded.score,
      updated_at = excluded.updated_at
  `).run(player.id, player.name, player.class, player.level, player.silver, player.kills, survivalDays, score, now);
}
let tickInterval = null;
function startGameLoop() {
    if (tickInterval)
        return;
    tickInterval = setInterval(() => {
        runGameTick();
    }, 30000);
    console.log('Game loop started (tick every 30s)');
}
function stopGameLoop() {
    if (tickInterval) {
        clearInterval(tickInterval);
        tickInterval = null;
    }
}
//# sourceMappingURL=gameLoop.js.map