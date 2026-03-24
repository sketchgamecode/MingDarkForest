import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/database';
import {
  CLASS_DEFINITIONS,
  calculateLevel,
  getXpRequired,
  applyLevelBonuses,
  getVisibilityDescription,
  CharacterClass,
} from '../game/character';
import {
  calculateOfflineProgress,
  UPGRADES,
  canAffordUpgrade,
  applyUpgradeCost,
  UpgradeId,
} from '../game/idle';
import { calculateAttack, canDetect } from '../game/darkForest';
import { REGIONS } from '../game/world';

const router = Router();

router.post('/', (req: Request, res: Response) => {
  const { name, characterClass } = req.body;

  if (!name || !characterClass) {
    return res.status(400).json({ error: 'Name and characterClass are required' });
  }

  if (!CLASS_DEFINITIONS[characterClass as CharacterClass]) {
    return res.status(400).json({ error: 'Invalid character class' });
  }

  const db = getDb();
  const existing = db.prepare('SELECT id FROM players WHERE name = ?').get(name);
  if (existing) {
    return res.status(409).json({ error: 'Player name already taken' });
  }

  const classDef = CLASS_DEFINITIONS[characterClass as CharacterClass];
  const stats = applyLevelBonuses(classDef.baseStats, 1);
  const id = uuidv4();
  const now = Math.floor(Date.now() / 1000);

  try {
    db.prepare(`
      INSERT INTO players (id, name, class, level, xp, health, max_health, attack, defense, wisdom, stealth,
        silver, knowledge, supplies, qi, visibility, stance, region, last_tick, last_active, created_at)
      VALUES (?, ?, ?, 1, 0, ?, ?, ?, ?, ?, ?, 50, 0, 0, 0, ?, 'balanced', 'Imperial Capital', ?, ?, ?)
    `).run(
      id, name, characterClass,
      stats.maxHealth, stats.maxHealth,
      stats.attack, stats.defense, stats.wisdom, stats.stealth,
      classDef.startingVisibility,
      now, now, now
    );

    db.prepare(`
      INSERT INTO events (type, message, player_id)
      VALUES ('player_created', ?, ?)
    `).run(`${name} entered the Dark Forest as a ${characterClass}`, id);

    const player = db.prepare('SELECT * FROM players WHERE id = ?').get(id);
    return res.status(201).json(formatPlayer(player));
  } catch (err) {
    return res.status(500).json({ error: 'Failed to create player' });
  }
});

router.get('/:id', (req: Request, res: Response) => {
  const db = getDb();
  const player = db.prepare('SELECT * FROM players WHERE id = ?').get(req.params.id);

  if (!player) {
    return res.status(404).json({ error: 'Player not found' });
  }

  return res.json(formatPlayer(player));
});

router.put('/:id/action', (req: Request, res: Response) => {
  const { action, target, regionName, upgradeId } = req.body;
  const db = getDb();

  const player = db.prepare('SELECT * FROM players WHERE id = ?').get(req.params.id) as any;
  if (!player) return res.status(404).json({ error: 'Player not found' });
  if (!player.alive) return res.status(400).json({ error: 'Your character has died. Create a new one.' });

  const now = Math.floor(Date.now() / 1000);
  db.prepare('UPDATE players SET last_active = ? WHERE id = ?').run(now, player.id);

  switch (action) {
    case 'hide': {
      db.prepare("UPDATE players SET stance = 'hide' WHERE id = ?").run(player.id);
      db.prepare("INSERT INTO events (type, message, player_id) VALUES ('action', ?, ?)").run(
        `${player.name} retreated into the shadows`, player.id
      );
      return res.json({ success: true, message: 'You have adopted the hiding stance. Reduced income but safer.' });
    }

    case 'expand': {
      db.prepare("UPDATE players SET stance = 'expand' WHERE id = ?").run(player.id);
      db.prepare("INSERT INTO events (type, message, player_id) VALUES ('action', ?, ?)").run(
        `${player.name} expanded their presence boldly`, player.id
      );
      return res.json({ success: true, message: 'You are expanding. Higher income but more visible!' });
    }

    case 'balanced': {
      db.prepare("UPDATE players SET stance = 'balanced' WHERE id = ?").run(player.id);
      return res.json({ success: true, message: 'Balanced stance adopted.' });
    }

    case 'move': {
      if (!regionName || !REGIONS.find(r => r.name === regionName)) {
        return res.status(400).json({ error: 'Invalid region name' });
      }
      const moveCost = 20;
      if (player.silver < moveCost) {
        return res.status(400).json({ error: `Moving costs ${moveCost} silver` });
      }
      db.prepare('UPDATE players SET region = ?, silver = silver - ? WHERE id = ?').run(regionName, moveCost, player.id);
      db.prepare("INSERT INTO events (type, message, player_id) VALUES ('action', ?, ?)").run(
        `${player.name} traveled to ${regionName}`, player.id
      );
      return res.json({ success: true, message: `Moved to ${regionName}. Cost: ${moveCost} silver.` });
    }

    case 'attack': {
      if (!target) return res.status(400).json({ error: 'Target player ID required' });
      const targetPlayer = db.prepare('SELECT * FROM players WHERE id = ? AND alive = 1').get(target) as any;
      if (!targetPlayer) return res.status(404).json({ error: 'Target not found or already dead' });
      if (targetPlayer.region !== player.region) {
        return res.status(400).json({ error: 'Target is not in your region' });
      }

      const canDetectTarget = canDetect(player.wisdom, player.class, targetPlayer.visibility, targetPlayer.stealth);
      if (!canDetectTarget && targetPlayer.visibility < 30) {
        return res.status(400).json({ error: 'Target is too well hidden for you to detect' });
      }

      const result = calculateAttack(
        player.class, player.attack, player.level,
        targetPlayer.class, targetPlayer.defense, targetPlayer.health,
        targetPlayer.stealth, targetPlayer.silver
      );

      if (result.success) {
        const targetDead = result.damageDealt >= targetPlayer.health;
        db.prepare('UPDATE players SET health = MAX(0, health - ?), silver = MAX(0, silver - ?), alive = ? WHERE id = ?').run(
          result.damageDealt, result.silverStolen, targetDead ? 0 : 1, targetPlayer.id
        );
        db.prepare('UPDATE players SET silver = silver + ?, xp = xp + ?, kills = kills + ? WHERE id = ?').run(
          result.silverStolen, result.xpGained, targetDead ? 1 : 0, player.id
        );
        if (targetDead) {
          db.prepare('UPDATE players SET deaths = deaths + 1 WHERE id = ?').run(targetPlayer.id);
          db.prepare("INSERT INTO events (type, message, player_id) VALUES ('pvp_kill', ?, ?)").run(
            `${player.name} slew ${targetPlayer.name} in combat!`, player.id
          );
        }
      }

      return res.json({ success: result.success, message: result.message });
    }

    case 'scout': {
      const classDef = CLASS_DEFINITIONS[player.class as CharacterClass];
      if (classDef.passiveBonus !== 'scout') {
        return res.status(400).json({ error: 'Only Scholars can use the scout ability' });
      }
      const nearbyPlayers = db.prepare(`
        SELECT id, name, class, level, visibility, region
        FROM players WHERE region = ? AND id != ? AND alive = 1
      `).all(player.region, player.id) as any[];

      const detected = nearbyPlayers.filter(p =>
        canDetect(player.wisdom, player.class, p.visibility, 0)
      );

      return res.json({
        success: true,
        detectedPlayers: detected.map(p => ({
          id: p.id,
          name: p.name,
          class: p.class,
          level: p.level,
          visibility: p.visibility,
          region: p.region,
        })),
        message: `Detected ${detected.length} players in ${player.region}`,
      });
    }

    case 'upgrade': {
      if (!upgradeId || !UPGRADES[upgradeId as UpgradeId]) {
        return res.status(400).json({ error: 'Invalid upgrade ID' });
      }
      const upgrades: Record<string, number> = JSON.parse(player.upgrades || '{}');
      const currentLevel = upgrades[upgradeId] || 0;

      const resources = {
        silver: player.silver,
        knowledge: player.knowledge,
        supplies: player.supplies,
        qi: player.qi,
      };

      if (!canAffordUpgrade(resources, upgradeId as UpgradeId, currentLevel)) {
        return res.status(400).json({ error: 'Cannot afford this upgrade or already at max level' });
      }

      const newResources = applyUpgradeCost(resources, upgradeId as UpgradeId, currentLevel);
      upgrades[upgradeId] = currentLevel + 1;

      db.prepare(`
        UPDATE players SET silver = ?, knowledge = ?, supplies = ?, qi = ?, upgrades = ?
        WHERE id = ?
      `).run(newResources.silver, newResources.knowledge, newResources.supplies, newResources.qi, JSON.stringify(upgrades), player.id);

      return res.json({
        success: true,
        message: `Upgraded ${UPGRADES[upgradeId as UpgradeId].name} to level ${currentLevel + 1}!`,
        newLevel: currentLevel + 1,
      });
    }

    case 'revive': {
      if (player.alive) return res.status(400).json({ error: 'You are still alive' });
      const reviveCost = player.level * 50;
      if (player.silver < reviveCost) {
        return res.status(400).json({ error: `Reviving costs ${reviveCost} silver` });
      }
      db.prepare(`
        UPDATE players SET alive = 1, health = max_health / 2, silver = silver - ?, visibility = 10
        WHERE id = ?
      `).run(reviveCost, player.id);
      return res.json({ success: true, message: `Revived! Lost ${reviveCost} silver.` });
    }

    default:
      return res.status(400).json({ error: 'Unknown action' });
  }
});

router.get('/:id/collect', (req: Request, res: Response) => {
  const db = getDb();
  const player = db.prepare('SELECT * FROM players WHERE id = ?').get(req.params.id) as any;

  if (!player) return res.status(404).json({ error: 'Player not found' });
  if (!player.alive) return res.status(400).json({ error: 'Player is dead' });

  const upgrades: Record<string, number> = JSON.parse(player.upgrades || '{}');
  const offlineGain = calculateOfflineProgress(
    player.class, player.level, player.stance, player.region,
    player.visibility, upgrades, player.last_tick
  );

  const now = Math.floor(Date.now() / 1000);
  const newXp = player.xp + offlineGain.xp;
  const newLevel = Math.min(50, calculateLevel(newXp));

  db.prepare(`
    UPDATE players SET
      silver = silver + ?,
      knowledge = knowledge + ?,
      supplies = supplies + ?,
      qi = qi + ?,
      xp = ?,
      level = ?,
      last_tick = ?
    WHERE id = ?
  `).run(
    offlineGain.silver, offlineGain.knowledge, offlineGain.supplies, offlineGain.qi,
    newXp, newLevel, now, player.id
  );

  const updatedPlayer = db.prepare('SELECT * FROM players WHERE id = ?').get(player.id);
  return res.json({
    ...formatPlayer(updatedPlayer),
    collected: offlineGain,
  });
});

function formatPlayer(player: any) {
  if (!player) return null;
  const upgrades = JSON.parse(player.upgrades || '{}');
  const level = player.level;
  const xpForNext = getXpRequired(level);

  return {
    id: player.id,
    name: player.name,
    class: player.class,
    level: player.level,
    xp: player.xp,
    xpForNextLevel: xpForNext,
    health: player.health,
    maxHealth: player.max_health,
    attack: player.attack,
    defense: player.defense,
    wisdom: player.wisdom,
    stealth: player.stealth,
    resources: {
      silver: Math.floor(player.silver * 100) / 100,
      knowledge: Math.floor(player.knowledge * 100) / 100,
      supplies: Math.floor(player.supplies * 100) / 100,
      qi: Math.floor(player.qi * 100) / 100,
    },
    visibility: player.visibility,
    visibilityDescription: getVisibilityDescription(player.visibility),
    stance: player.stance,
    region: player.region,
    upgrades,
    alive: Boolean(player.alive),
    kills: player.kills,
    deaths: player.deaths,
    lastTick: player.last_tick,
    createdAt: player.created_at,
  };
}

export default router;
