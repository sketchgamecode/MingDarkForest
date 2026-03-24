"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.THREATS = void 0;
exports.calculateThreatChance = calculateThreatChance;
exports.selectThreat = selectThreat;
exports.resolveEncounter = resolveEncounter;
exports.updateVisibility = updateVisibility;
exports.calculateAttack = calculateAttack;
exports.canDetect = canDetect;
const character_1 = require("./character");
exports.THREATS = [
    {
        id: 'bandit_gang',
        name: 'Bandit Gang',
        type: 'bandit',
        attack: 15,
        damage: 20,
        detectionThreshold: 30,
        visibilityRequired: 20,
        reward: { silver: 30, xp: 15 },
    },
    {
        id: 'mongol_raider',
        name: 'Mongol Raider',
        type: 'mongol',
        attack: 30,
        damage: 45,
        detectionThreshold: 50,
        visibilityRequired: 40,
        reward: { silver: 80, xp: 40 },
    },
    {
        id: 'imperial_spy',
        name: 'Imperial Spy',
        type: 'imperial_guard',
        attack: 20,
        damage: 30,
        detectionThreshold: 60,
        visibilityRequired: 30,
        reward: { silver: 50, xp: 25 },
    },
    {
        id: 'forest_ghost',
        name: 'Dark Forest Ghost',
        type: 'ghost',
        attack: 40,
        damage: 60,
        detectionThreshold: 80,
        visibilityRequired: 60,
        reward: { silver: 120, xp: 60 },
    },
    {
        id: 'assassin',
        name: 'Shadow Assassin',
        type: 'rival',
        attack: 50,
        damage: 80,
        detectionThreshold: 90,
        visibilityRequired: 50,
        reward: { silver: 150, xp: 75 },
    },
];
function calculateThreatChance(visibility, stance, region, level) {
    const REGION_THREAT_MULTIPLIERS = {
        'Imperial Capital': 1.2,
        'Silk Road': 1.5,
        'Yangtze Delta': 0.9,
        'Mountain Hermitage': 0.5,
        'Forbidden City': 0.7,
    };
    const regionMult = REGION_THREAT_MULTIPLIERS[region] || 1.0;
    const stanceMult = stance === 'expand' ? 1.5 : stance === 'hide' ? 0.3 : 1.0;
    const levelMult = Math.max(0.5, 1 - level * 0.01);
    const baseChance = (visibility / 100) * 0.4;
    return Math.min(0.95, baseChance * regionMult * stanceMult * levelMult);
}
function selectThreat(visibility) {
    const eligible = exports.THREATS.filter((t) => t.visibilityRequired <= visibility);
    if (eligible.length === 0)
        return exports.THREATS[0];
    const weights = eligible.map((t) => t.visibilityRequired + 10);
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let rand = Math.random() * totalWeight;
    for (let i = 0; i < eligible.length; i++) {
        rand -= weights[i];
        if (rand <= 0)
            return eligible[i];
    }
    return eligible[eligible.length - 1];
}
function resolveEncounter(playerClass, playerAttack, playerDefense, playerWisdom, playerStealth, playerHealth, threat, upgrades) {
    const classDef = character_1.CLASS_DEFINITIONS[playerClass];
    const stealthBonus = playerStealth / 100;
    const avoidChance = stealthBonus * (classDef.passiveBonus === 'hide' ? 1.5 : 1.0);
    if (Math.random() < avoidChance) {
        return {
            encountered: true,
            threat,
            survived: true,
            damageDealt: 0,
            damageTaken: 0,
            message: `Your stealth allowed you to avoid the ${threat.name}!`,
        };
    }
    if (classDef.passiveBonus === 'bribe' && Math.random() < 0.3) {
        return {
            encountered: true,
            threat,
            survived: true,
            damageDealt: 0,
            damageTaken: 0,
            message: `You bribed the ${threat.name} to leave you alone!`,
        };
    }
    const damageReduction = 1 - (upgrades['fortification'] || 0) * 0.15;
    const playerDamageDealt = Math.max(1, playerAttack - Math.floor(threat.attack * 0.3) + Math.floor(Math.random() * 10));
    const damageTaken = Math.max(1, Math.floor((threat.damage - Math.floor(playerDefense * 0.4)) * damageReduction +
        Math.floor(Math.random() * 10)));
    const survived = playerHealth - damageTaken > 0;
    const threatDefeated = playerDamageDealt >= threat.attack;
    const reward = survived && threatDefeated
        ? threat.reward
        : { silver: 0, xp: Math.floor(threat.reward.xp * 0.3) };
    return {
        encountered: true,
        threat,
        survived,
        damageDealt: playerDamageDealt,
        damageTaken,
        reward,
        message: survived
            ? threatDefeated
                ? `You defeated the ${threat.name}! Gained ${reward.silver} silver and ${reward.xp} XP.`
                : `You escaped from the ${threat.name} but took ${damageTaken} damage!`
            : `You were slain by the ${threat.name}!`,
    };
}
function updateVisibility(currentVisibility, stance, playerClass, upgrades) {
    const classDef = character_1.CLASS_DEFINITIONS[playerClass];
    const stealthCloak = 1 - (upgrades['stealth_cloak'] || 0) * 0.2;
    let delta = 0;
    if (stance === 'expand') {
        delta = 5 * stealthCloak;
    }
    else if (stance === 'hide') {
        delta = -8 * (classDef.passiveBonus === 'hide' ? 1.5 : 1.0);
    }
    else {
        delta = (classDef.passiveBonus === 'hide' ? -2 : 1) * stealthCloak;
    }
    return Math.max(0, Math.min(100, Math.round(currentVisibility + delta)));
}
function calculateAttack(attackerClass, attackerAttack, attackerLevel, defenderClass, defenderDefense, defenderHealth, defenderStealth, defenderSilver) {
    const attackerDef = character_1.CLASS_DEFINITIONS[attackerClass];
    if (attackerDef.passiveBonus !== 'attack' && Math.random() < 0.3) {
        return {
            success: false,
            damageDealt: 0,
            message: 'Your attack failed - only Warriors excel at player combat!',
            xpGained: 0,
            silverStolen: 0,
        };
    }
    const stealthDodge = defenderStealth / 150;
    if (Math.random() < stealthDodge) {
        return {
            success: false,
            damageDealt: 0,
            message: 'Target evaded your attack using stealth!',
            xpGained: 5,
            silverStolen: 0,
        };
    }
    const damage = Math.max(5, attackerAttack * 1.5 - defenderDefense * 0.5 + Math.random() * 20);
    const damageDealt = Math.floor(damage);
    const killed = damageDealt >= defenderHealth;
    const silverStolen = killed
        ? Math.floor(defenderSilver * 0.2)
        : Math.floor(defenderSilver * 0.05);
    const xpGained = killed ? attackerLevel * 20 : attackerLevel * 5;
    return {
        success: true,
        damageDealt,
        message: killed
            ? `You slew your target! Stolen ${silverStolen} silver!`
            : `You attacked your target for ${damageDealt} damage!`,
        xpGained,
        silverStolen,
    };
}
function canDetect(detectorWisdom, detectorClass, targetVisibility, targetStealth) {
    const classDef = character_1.CLASS_DEFINITIONS[detectorClass];
    const wisdomBonus = classDef.passiveBonus === 'scout' ? 1.5 : 1.0;
    const detectionPower = detectorWisdom * wisdomBonus;
    const hidingPower = (100 - targetVisibility) + targetStealth;
    return detectionPower > hidingPower * 0.5;
}
//# sourceMappingURL=darkForest.js.map