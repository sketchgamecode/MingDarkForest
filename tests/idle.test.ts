import {
  calculateResourceTick,
  calculateOfflineProgress,
  canAffordUpgrade,
  applyUpgradeCost,
  UPGRADES,
} from '../src/game/idle';

describe('idle', () => {
  describe('calculateResourceTick', () => {
    it('generates resources for Scholar', () => {
      const tick = calculateResourceTick('Scholar', 1, 'balanced', 'Imperial Capital', 50, {}, 30);
      expect(tick.silver).toBeGreaterThan(0);
      expect(tick.knowledge).toBeGreaterThan(0);
    });

    it('expand stance gives more resources than hide', () => {
      const expandTick = calculateResourceTick('Merchant', 1, 'expand', 'Imperial Capital', 50, {}, 30);
      const hideTick = calculateResourceTick('Merchant', 1, 'hide', 'Imperial Capital', 50, {}, 30);
      expect(expandTick.silver).toBeGreaterThan(hideTick.silver);
    });

    it('higher level gives more resources', () => {
      const level1 = calculateResourceTick('Warrior', 1, 'balanced', 'Imperial Capital', 50, {}, 30);
      const level10 = calculateResourceTick('Warrior', 10, 'balanced', 'Imperial Capital', 50, {}, 30);
      expect(level10.silver).toBeGreaterThan(level1.silver);
    });

    it('upgrades multiply resource generation', () => {
      const noUpgrade = calculateResourceTick('Merchant', 1, 'balanced', 'Imperial Capital', 50, {}, 30);
      const withUpgrade = calculateResourceTick('Merchant', 1, 'balanced', 'Imperial Capital', 50, { silver_boost: 1 }, 30);
      expect(withUpgrade.silver).toBeGreaterThan(noUpgrade.silver);
    });

    it('elapsed time of 0 gives 0 resources', () => {
      const tick = calculateResourceTick('Scholar', 1, 'balanced', 'Imperial Capital', 50, {}, 0);
      expect(tick.silver).toBe(0);
    });
  });

  describe('calculateOfflineProgress', () => {
    it('returns zero for future last_tick', () => {
      const future = Math.floor(Date.now() / 1000) + 1000;
      const result = calculateOfflineProgress('Scholar', 1, 'balanced', 'Imperial Capital', 50, {}, future);
      expect(result.silver).toBe(0);
    });

    it('returns progress for past last_tick', () => {
      const past = Math.floor(Date.now() / 1000) - 3600;
      const result = calculateOfflineProgress('Merchant', 1, 'balanced', 'Imperial Capital', 50, {}, past);
      expect(result.silver).toBeGreaterThan(0);
    });

    it('offline progress is 70% of online', () => {
      const past = Math.floor(Date.now() / 1000) - 60;
      const result = calculateOfflineProgress('Merchant', 1, 'balanced', 'Imperial Capital', 50, {}, past);
      const online = calculateResourceTick('Merchant', 1, 'balanced', 'Imperial Capital', 50, {}, 60);
      expect(result.silver).toBeCloseTo(online.silver * 0.7, 0);
    });
  });

  describe('canAffordUpgrade', () => {
    it('returns false when insufficient resources', () => {
      const poorResources = { silver: 0, knowledge: 0, supplies: 0, qi: 0 };
      expect(canAffordUpgrade(poorResources, 'silver_boost', 0)).toBe(false);
    });

    it('returns true when sufficient resources', () => {
      const richResources = { silver: 1000, knowledge: 1000, supplies: 1000, qi: 1000 };
      expect(canAffordUpgrade(richResources, 'silver_boost', 0)).toBe(true);
    });

    it('returns false when at max level', () => {
      const richResources = { silver: 99999, knowledge: 99999, supplies: 99999, qi: 99999 };
      const maxLevel = UPGRADES.silver_boost.maxLevel;
      expect(canAffordUpgrade(richResources, 'silver_boost', maxLevel)).toBe(false);
    });
  });

  describe('applyUpgradeCost', () => {
    it('deducts correct cost for level 0 upgrade', () => {
      const resources = { silver: 1000, knowledge: 1000, supplies: 1000, qi: 1000 };
      const result = applyUpgradeCost(resources, 'silver_boost', 0);
      expect(result.silver).toBe(resources.silver - UPGRADES.silver_boost.cost.silver);
    });

    it('deducts double cost at level 1 (2^1 multiplier)', () => {
      const resources = { silver: 10000, knowledge: 10000, supplies: 10000, qi: 10000 };
      const result = applyUpgradeCost(resources, 'silver_boost', 1);
      expect(result.silver).toBe(resources.silver - UPGRADES.silver_boost.cost.silver * 2);
    });
  });
});
