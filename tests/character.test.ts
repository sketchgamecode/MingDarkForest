import {
  getXpRequired,
  calculateLevel,
  applyLevelBonuses,
  getVisibilityDescription,
  getVisibilityTier,
  CLASS_DEFINITIONS,
} from '../src/game/character';

describe('character', () => {
  describe('getXpRequired', () => {
    it('returns 100 for level 1', () => {
      expect(getXpRequired(1)).toBe(100);
    });

    it('increases with each level', () => {
      expect(getXpRequired(2)).toBeGreaterThan(getXpRequired(1));
      expect(getXpRequired(3)).toBeGreaterThan(getXpRequired(2));
    });
  });

  describe('calculateLevel', () => {
    it('returns level 1 for 0 xp', () => {
      expect(calculateLevel(0)).toBe(1);
    });

    it('returns level 2 after enough xp', () => {
      expect(calculateLevel(100)).toBe(2);
    });

    it('returns level 3 after xp for levels 1 and 2', () => {
      expect(calculateLevel(100 + 150)).toBe(3);
    });

    it('caps at level 50', () => {
      expect(calculateLevel(Number.MAX_SAFE_INTEGER)).toBe(50);
    });
  });

  describe('applyLevelBonuses', () => {
    it('applies level bonuses to base stats', () => {
      const base = { health: 100, maxHealth: 100, attack: 10, defense: 10, wisdom: 10, stealth: 10 };
      const result = applyLevelBonuses(base, 2);
      expect(result.maxHealth).toBeGreaterThan(base.maxHealth);
      expect(result.attack).toBeGreaterThan(base.attack);
    });
  });

  describe('getVisibilityDescription', () => {
    it('returns correct descriptions', () => {
      expect(getVisibilityDescription(10)).toBe('Hidden in shadows');
      expect(getVisibilityDescription(30)).toBe('Moving cautiously');
      expect(getVisibilityDescription(60)).toBe('Known presence');
      expect(getVisibilityDescription(90)).toBe('Blazing beacon');
    });
  });

  describe('getVisibilityTier', () => {
    it('returns tier 1 for low visibility', () => {
      expect(getVisibilityTier(10)).toBe(1);
    });
    it('returns tier 4 for high visibility', () => {
      expect(getVisibilityTier(90)).toBe(4);
    });
  });

  describe('CLASS_DEFINITIONS', () => {
    it('has all five classes', () => {
      expect(CLASS_DEFINITIONS.Scholar).toBeDefined();
      expect(CLASS_DEFINITIONS.Warrior).toBeDefined();
      expect(CLASS_DEFINITIONS.Merchant).toBeDefined();
      expect(CLASS_DEFINITIONS.Monk).toBeDefined();
      expect(CLASS_DEFINITIONS.Hermit).toBeDefined();
    });

    it('Warrior has highest attack', () => {
      const attacks = Object.values(CLASS_DEFINITIONS).map(c => c.baseStats.attack);
      expect(CLASS_DEFINITIONS.Warrior.baseStats.attack).toBe(Math.max(...attacks));
    });

    it('Hermit has highest stealth', () => {
      const stealths = Object.values(CLASS_DEFINITIONS).map(c => c.baseStats.stealth);
      expect(CLASS_DEFINITIONS.Hermit.baseStats.stealth).toBe(Math.max(...stealths));
    });
  });
});
