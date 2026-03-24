"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REGION_BONUSES = exports.UPGRADES = void 0;
exports.calculateResourceTick = calculateResourceTick;
exports.calculateOfflineProgress = calculateOfflineProgress;
exports.canAffordUpgrade = canAffordUpgrade;
exports.applyUpgradeCost = applyUpgradeCost;
const character_1 = require("./character");
exports.UPGRADES = {
    silver_boost: {
        id: 'silver_boost',
        name: 'Trade Connections',
        description: 'Increase silver generation by 25% per level',
        cost: { silver: 100, knowledge: 0, supplies: 0, qi: 0 },
        effect: 'silver_rate',
        maxLevel: 5,
    },
    knowledge_boost: {
        id: 'knowledge_boost',
        name: 'Imperial Library',
        description: 'Increase knowledge generation by 25% per level',
        cost: { silver: 50, knowledge: 50, supplies: 0, qi: 0 },
        effect: 'knowledge_rate',
        maxLevel: 5,
    },
    supplies_boost: {
        id: 'supplies_boost',
        name: 'Military Stockpile',
        description: 'Increase supplies generation by 25% per level',
        cost: { silver: 75, knowledge: 0, supplies: 25, qi: 0 },
        effect: 'supplies_rate',
        maxLevel: 5,
    },
    qi_boost: {
        id: 'qi_boost',
        name: 'Meditation Retreat',
        description: 'Increase qi generation by 25% per level',
        cost: { silver: 30, knowledge: 20, supplies: 0, qi: 30 },
        effect: 'qi_rate',
        maxLevel: 5,
    },
    stealth_cloak: {
        id: 'stealth_cloak',
        name: 'Shadow Technique',
        description: 'Reduce passive visibility gain by 20% per level',
        cost: { silver: 80, knowledge: 40, supplies: 0, qi: 20 },
        effect: 'visibility_reduction',
        maxLevel: 3,
    },
    fortification: {
        id: 'fortification',
        name: 'Hidden Fortress',
        description: 'Reduce damage taken from threats by 15% per level',
        cost: { silver: 120, knowledge: 0, supplies: 80, qi: 0 },
        effect: 'damage_reduction',
        maxLevel: 3,
    },
    trade_network: {
        id: 'trade_network',
        name: 'Secret Trade Network',
        description: "Gain silver from other players' actions in your region",
        cost: { silver: 200, knowledge: 50, supplies: 50, qi: 0 },
        effect: 'passive_silver',
        maxLevel: 2,
    },
};
exports.REGION_BONUSES = {
    'Imperial Capital': { silver: 1.5, knowledge: 1.3, supplies: 1.0, qi: 0.8, threatMultiplier: 1.2 },
    'Silk Road': { silver: 2.0, knowledge: 0.8, supplies: 1.5, qi: 0.7, threatMultiplier: 1.5 },
    'Yangtze Delta': { silver: 1.3, knowledge: 1.0, supplies: 1.2, qi: 1.1, threatMultiplier: 0.9 },
    'Mountain Hermitage': { silver: 0.6, knowledge: 1.5, supplies: 0.8, qi: 2.0, threatMultiplier: 0.5 },
    'Forbidden City': { silver: 1.8, knowledge: 2.0, supplies: 1.0, qi: 1.0, threatMultiplier: 0.7 },
};
function calculateResourceTick(playerClass, level, stance, region, visibility, upgrades, elapsedSeconds) {
    const classDef = character_1.CLASS_DEFINITIONS[playerClass];
    const regionBonus = exports.REGION_BONUSES[region] || exports.REGION_BONUSES['Imperial Capital'];
    const stanceMultiplier = stance === 'hide' ? 0.5 : stance === 'expand' ? 1.8 : 1.0;
    const levelMultiplier = 1 + (level - 1) * 0.1;
    const visibilityTier = (0, character_1.getVisibilityTier)(visibility);
    const visibilityMultiplier = [0, 0.7, 1.0, 1.4, 1.8][visibilityTier];
    const upgradeMultipliers = {
        silver: 1 + (upgrades['silver_boost'] || 0) * 0.25,
        knowledge: 1 + (upgrades['knowledge_boost'] || 0) * 0.25,
        supplies: 1 + (upgrades['supplies_boost'] || 0) * 0.25,
        qi: 1 + (upgrades['qi_boost'] || 0) * 0.25,
    };
    const ticksPerSecond = elapsedSeconds / 30;
    return {
        silver: classDef.resourceRates.silver *
            (regionBonus.silver || 1) *
            stanceMultiplier *
            levelMultiplier *
            visibilityMultiplier *
            upgradeMultipliers.silver *
            ticksPerSecond,
        knowledge: classDef.resourceRates.knowledge *
            (regionBonus.knowledge || 1) *
            stanceMultiplier *
            levelMultiplier *
            upgradeMultipliers.knowledge *
            ticksPerSecond,
        supplies: classDef.resourceRates.supplies *
            (regionBonus.supplies || 1) *
            stanceMultiplier *
            levelMultiplier *
            upgradeMultipliers.supplies *
            ticksPerSecond,
        qi: classDef.resourceRates.qi *
            (regionBonus.qi || 1) *
            stanceMultiplier *
            levelMultiplier *
            upgradeMultipliers.qi *
            ticksPerSecond,
        xp: Math.floor((level * 2 + visibilityTier * 3) * stanceMultiplier * ticksPerSecond),
    };
}
function calculateOfflineProgress(playerClass, level, stance, region, visibility, upgrades, lastTick) {
    const now = Math.floor(Date.now() / 1000);
    const MAX_OFFLINE_SECONDS = 8 * 3600;
    const elapsed = Math.min(now - lastTick, MAX_OFFLINE_SECONDS);
    if (elapsed <= 0)
        return { silver: 0, knowledge: 0, supplies: 0, qi: 0, xp: 0 };
    const tick = calculateResourceTick(playerClass, level, stance, region, visibility, upgrades, elapsed);
    return {
        silver: tick.silver * 0.7,
        knowledge: tick.knowledge * 0.7,
        supplies: tick.supplies * 0.7,
        qi: tick.qi * 0.7,
        xp: Math.floor(tick.xp * 0.7),
    };
}
function canAffordUpgrade(resources, upgradeId, currentLevel) {
    const upgrade = exports.UPGRADES[upgradeId];
    if (!upgrade || currentLevel >= upgrade.maxLevel)
        return false;
    const costMultiplier = Math.pow(2, currentLevel);
    return (resources.silver >= upgrade.cost.silver * costMultiplier &&
        resources.knowledge >= upgrade.cost.knowledge * costMultiplier &&
        resources.supplies >= upgrade.cost.supplies * costMultiplier &&
        resources.qi >= upgrade.cost.qi * costMultiplier);
}
function applyUpgradeCost(resources, upgradeId, currentLevel) {
    const upgrade = exports.UPGRADES[upgradeId];
    const costMultiplier = Math.pow(2, currentLevel);
    return {
        silver: resources.silver - upgrade.cost.silver * costMultiplier,
        knowledge: resources.knowledge - upgrade.cost.knowledge * costMultiplier,
        supplies: resources.supplies - upgrade.cost.supplies * costMultiplier,
        qi: resources.qi - upgrade.cost.qi * costMultiplier,
    };
}
//# sourceMappingURL=idle.js.map