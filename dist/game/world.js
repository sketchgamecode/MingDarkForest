"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REGIONS = void 0;
exports.getActiveWorldEvents = getActiveWorldEvents;
exports.triggerRandomWorldEvent = triggerRandomWorldEvent;
exports.getWorldEventMultipliers = getWorldEventMultipliers;
exports.getWorldState = getWorldState;
const database_1 = require("../db/database");
exports.REGIONS = [
    {
        name: 'Imperial Capital',
        description: 'The heart of Ming power. High rewards but constant surveillance.',
        threatLevel: 'High',
        specialResource: 'Silver',
        icon: '🏯',
    },
    {
        name: 'Silk Road',
        description: 'Ancient trade routes. Massive silver potential but dangerous.',
        threatLevel: 'Very High',
        specialResource: 'Silver',
        icon: '🐪',
    },
    {
        name: 'Yangtze Delta',
        description: 'Fertile lands by the great river. Balanced and relatively safe.',
        threatLevel: 'Medium',
        specialResource: 'Supplies',
        icon: '🌊',
    },
    {
        name: 'Mountain Hermitage',
        description: 'Remote peaks where masters meditate. Low threat, high Qi.',
        threatLevel: 'Low',
        specialResource: 'Qi',
        icon: '⛰️',
    },
    {
        name: 'Forbidden City',
        description: 'Imperial palace grounds. Extreme knowledge but restricted access.',
        threatLevel: 'Low',
        specialResource: 'Knowledge',
        icon: '🔮',
    },
];
const WORLD_EVENT_POOL = [
    {
        type: 'mongol_raid',
        name: 'Mongol Raid',
        description: 'Mongol forces sweep through the region! All players take increased threat.',
        effect: JSON.stringify({ threatMultiplier: 2.0, region: 'Silk Road' }),
        region: 'Silk Road',
        duration: 600,
    },
    {
        type: 'imperial_decree',
        name: 'Imperial Decree',
        description: 'The Emperor issues a new decree. Knowledge generation doubled!',
        effect: JSON.stringify({ knowledgeMultiplier: 2.0, region: null }),
        region: null,
        duration: 300,
    },
    {
        type: 'trade_caravan',
        name: 'Grand Trade Caravan',
        description: 'A massive trade caravan arrives! Silver generation tripled on Silk Road.',
        effect: JSON.stringify({ silverMultiplier: 3.0, region: 'Silk Road' }),
        region: 'Silk Road',
        duration: 180,
    },
    {
        type: 'plague',
        name: 'Spreading Plague',
        description: 'Disease spreads through the Yangtze Delta. Reduced resources in the region.',
        effect: JSON.stringify({ resourceMultiplier: 0.5, region: 'Yangtze Delta' }),
        region: 'Yangtze Delta',
        duration: 450,
    },
    {
        type: 'enlightenment',
        name: 'Age of Enlightenment',
        description: 'A period of peace and learning. All players gain bonus XP.',
        effect: JSON.stringify({ xpMultiplier: 1.5, region: null }),
        region: null,
        duration: 360,
    },
    {
        type: 'dark_omen',
        name: 'Dark Forest Omen',
        description: 'Strange signals detected. All hidden players feel uneasy...',
        effect: JSON.stringify({ visibilityIncrease: 10, region: null }),
        region: null,
        duration: 240,
    },
];
function getActiveWorldEvents() {
    const db = (0, database_1.getDb)();
    const now = Math.floor(Date.now() / 1000);
    db.prepare(`
    UPDATE world_events SET active = 0
    WHERE active = 1 AND started_at + duration < ?
  `).run(now);
    return db.prepare(`
    SELECT id, type, name, description, effect, region, duration, started_at as startedAt, active
    FROM world_events WHERE active = 1
  `).all();
}
function triggerRandomWorldEvent() {
    const db = (0, database_1.getDb)();
    const activeCount = db.prepare('SELECT COUNT(*) as count FROM world_events WHERE active = 1').get().count;
    if (activeCount >= 3)
        return null;
    if (Math.random() > 0.15)
        return null;
    const event = WORLD_EVENT_POOL[Math.floor(Math.random() * WORLD_EVENT_POOL.length)];
    const result = db.prepare(`
    INSERT INTO world_events (type, name, description, effect, region, duration)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(event.type, event.name, event.description, event.effect, event.region, event.duration);
    return db.prepare(`
    SELECT id, type, name, description, effect, region, duration, started_at as startedAt, active
    FROM world_events WHERE id = ?
  `).get(result.lastInsertRowid);
}
function getWorldEventMultipliers(playerRegion, activeEvents) {
    const multipliers = {
        silverMultiplier: 1,
        knowledgeMultiplier: 1,
        xpMultiplier: 1,
        threatMultiplier: 1,
        resourceMultiplier: 1,
        visibilityIncrease: 0,
    };
    for (const event of activeEvents) {
        if (event.region && event.region !== playerRegion)
            continue;
        try {
            const effect = JSON.parse(event.effect);
            if (effect.silverMultiplier)
                multipliers.silverMultiplier *= effect.silverMultiplier;
            if (effect.knowledgeMultiplier)
                multipliers.knowledgeMultiplier *= effect.knowledgeMultiplier;
            if (effect.xpMultiplier)
                multipliers.xpMultiplier *= effect.xpMultiplier;
            if (effect.threatMultiplier)
                multipliers.threatMultiplier *= effect.threatMultiplier;
            if (effect.resourceMultiplier)
                multipliers.resourceMultiplier *= effect.resourceMultiplier;
            if (effect.visibilityIncrease)
                multipliers.visibilityIncrease += effect.visibilityIncrease;
        }
        catch {
            // ignore malformed effects
        }
    }
    return multipliers;
}
function getWorldState() {
    const db = (0, database_1.getDb)();
    const now = Math.floor(Date.now() / 1000);
    const playersByRegion = {};
    for (const region of exports.REGIONS) {
        const count = db.prepare('SELECT COUNT(*) as count FROM players WHERE region = ? AND alive = 1').get(region.name).count;
        playersByRegion[region.name] = count;
    }
    const activeEvents = getActiveWorldEvents();
    const recentEvents = db.prepare(`
    SELECT type, message, created_at as createdAt
    FROM events
    WHERE created_at > ?
    ORDER BY created_at DESC
    LIMIT 20
  `).all(now - 300);
    return {
        regions: exports.REGIONS.map(r => ({
            ...r,
            playerCount: playersByRegion[r.name] || 0,
        })),
        activeEvents,
        recentEvents,
        timestamp: now,
    };
}
//# sourceMappingURL=world.js.map