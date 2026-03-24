export type CharacterClass = 'Scholar' | 'Warrior' | 'Merchant' | 'Monk' | 'Hermit';

export interface CharacterStats {
  health: number;
  maxHealth: number;
  attack: number;
  defense: number;
  wisdom: number;
  stealth: number;
}

export interface ClassDefinition {
  name: CharacterClass;
  chineseName: string;
  description: string;
  baseStats: CharacterStats;
  resourceRates: {
    silver: number;
    knowledge: number;
    supplies: number;
    qi: number;
  };
  passiveBonus: string;
  startingVisibility: number;
}

export const CLASS_DEFINITIONS: Record<CharacterClass, ClassDefinition> = {
  Scholar: {
    name: 'Scholar',
    chineseName: '文士',
    description: 'High wisdom, generates Knowledge passively, can scout threats',
    baseStats: {
      health: 80,
      maxHealth: 80,
      attack: 8,
      defense: 10,
      wisdom: 20,
      stealth: 12,
    },
    resourceRates: {
      silver: 1.0,
      knowledge: 3.0,
      supplies: 0.5,
      qi: 1.0,
    },
    passiveBonus: 'scout',
    startingVisibility: 30,
  },
  Warrior: {
    name: 'Warrior',
    chineseName: '武士',
    description: 'High attack/defense, generates Supplies, can attack players',
    baseStats: {
      health: 150,
      maxHealth: 150,
      attack: 20,
      defense: 18,
      wisdom: 8,
      stealth: 8,
    },
    resourceRates: {
      silver: 1.5,
      knowledge: 0.3,
      supplies: 3.0,
      qi: 0.5,
    },
    passiveBonus: 'attack',
    startingVisibility: 60,
  },
  Merchant: {
    name: 'Merchant',
    chineseName: '商人',
    description: 'Balanced stats, generates Silver fastest, can bribe threats',
    baseStats: {
      health: 100,
      maxHealth: 100,
      attack: 12,
      defense: 12,
      wisdom: 14,
      stealth: 10,
    },
    resourceRates: {
      silver: 4.0,
      knowledge: 0.8,
      supplies: 1.5,
      qi: 0.5,
    },
    passiveBonus: 'bribe',
    startingVisibility: 45,
  },
  Monk: {
    name: 'Monk',
    chineseName: '和尚',
    description: 'High Qi generation, heals others, very low visibility',
    baseStats: {
      health: 110,
      maxHealth: 110,
      attack: 10,
      defense: 15,
      wisdom: 18,
      stealth: 16,
    },
    resourceRates: {
      silver: 0.5,
      knowledge: 1.5,
      supplies: 0.5,
      qi: 4.0,
    },
    passiveBonus: 'heal',
    startingVisibility: 20,
  },
  Hermit: {
    name: 'Hermit',
    chineseName: '隐士',
    description: 'Maximum stealth, slow but safe progression',
    baseStats: {
      health: 90,
      maxHealth: 90,
      attack: 9,
      defense: 14,
      wisdom: 16,
      stealth: 25,
    },
    resourceRates: {
      silver: 0.8,
      knowledge: 1.2,
      supplies: 0.8,
      qi: 2.0,
    },
    passiveBonus: 'hide',
    startingVisibility: 10,
  },
};

export function getXpRequired(level: number): number {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

export function getStatBonusForLevel(level: number): Partial<CharacterStats> {
  return {
    maxHealth: level * 5,
    attack: Math.floor(level * 0.8),
    defense: Math.floor(level * 0.8),
    wisdom: Math.floor(level * 0.5),
    stealth: Math.floor(level * 0.3),
  };
}

export function applyLevelBonuses(
  baseStats: CharacterStats,
  level: number
): CharacterStats {
  const bonus = getStatBonusForLevel(level);
  return {
    health: baseStats.maxHealth + (bonus.maxHealth || 0),
    maxHealth: baseStats.maxHealth + (bonus.maxHealth || 0),
    attack: baseStats.attack + (bonus.attack || 0),
    defense: baseStats.defense + (bonus.defense || 0),
    wisdom: baseStats.wisdom + (bonus.wisdom || 0),
    stealth: baseStats.stealth + (bonus.stealth || 0),
  };
}

export function calculateLevel(xp: number): number {
  let level = 1;
  let remaining = xp;
  while (level < 50 && remaining >= getXpRequired(level)) {
    remaining -= getXpRequired(level);
    level++;
  }
  return level;
}

export function getVisibilityDescription(visibility: number): string {
  if (visibility <= 20) return 'Hidden in shadows';
  if (visibility <= 50) return 'Moving cautiously';
  if (visibility <= 80) return 'Known presence';
  return 'Blazing beacon';
}

export function getVisibilityTier(visibility: number): 1 | 2 | 3 | 4 {
  if (visibility <= 20) return 1;
  if (visibility <= 50) return 2;
  if (visibility <= 80) return 3;
  return 4;
}
