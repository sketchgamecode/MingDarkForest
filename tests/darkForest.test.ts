import {
  calculateThreatChance,
  selectThreat,
  resolveEncounter,
  updateVisibility,
  calculateAttack,
  canDetect,
  THREATS,
} from '../src/game/darkForest';

describe('darkForest', () => {
  describe('calculateThreatChance', () => {
    it('returns higher threat for higher visibility', () => {
      const low = calculateThreatChance(10, 'balanced', 'Imperial Capital', 1);
      const high = calculateThreatChance(90, 'balanced', 'Imperial Capital', 1);
      expect(high).toBeGreaterThan(low);
    });

    it('hide stance reduces threat chance significantly', () => {
      const hide = calculateThreatChance(50, 'hide', 'Imperial Capital', 1);
      const expand = calculateThreatChance(50, 'expand', 'Imperial Capital', 1);
      expect(hide).toBeLessThan(expand);
    });

    it('never exceeds 0.95', () => {
      const chance = calculateThreatChance(100, 'expand', 'Silk Road', 1);
      expect(chance).toBeLessThanOrEqual(0.95);
    });

    it('returns 0 for 0 visibility', () => {
      const chance = calculateThreatChance(0, 'balanced', 'Imperial Capital', 1);
      expect(chance).toBe(0);
    });
  });

  describe('selectThreat', () => {
    it('returns a valid threat', () => {
      const threat = selectThreat(50);
      expect(THREATS).toContain(threat);
    });

    it('returns first threat even with 0 visibility', () => {
      const threat = selectThreat(0);
      expect(threat).toBeDefined();
    });
  });

  describe('resolveEncounter', () => {
    const baseThreat = THREATS[0];

    it('returns an encounter result', () => {
      const result = resolveEncounter('Warrior', 20, 18, 8, 8, 150, baseThreat, {});
      expect(result.encountered).toBe(true);
      expect(result.message).toBeTruthy();
    });

    it('Hermit with high stealth often avoids encounters', () => {
      let avoided = 0;
      for (let i = 0; i < 100; i++) {
        const result = resolveEncounter('Hermit', 9, 14, 16, 25, 90, baseThreat, {});
        if (result.damageTaken === 0 && result.survived) avoided++;
      }
      expect(avoided).toBeGreaterThan(10);
    });

    it('player dies when damage exceeds health', () => {
      const result = resolveEncounter('Scholar', 8, 10, 20, 0, 1, THREATS[4], {});
      if (result.damageTaken && result.damageTaken >= 1) {
        expect(result.survived).toBeFalsy();
      }
    });
  });

  describe('updateVisibility', () => {
    it('increases visibility in expand stance', () => {
      const result = updateVisibility(50, 'expand', 'Scholar', {});
      expect(result).toBeGreaterThan(50);
    });

    it('decreases visibility in hide stance', () => {
      const result = updateVisibility(50, 'hide', 'Scholar', {});
      expect(result).toBeLessThan(50);
    });

    it('Hermit decreases visibility in balanced stance', () => {
      const result = updateVisibility(50, 'balanced', 'Hermit', {});
      expect(result).toBeLessThan(50);
    });

    it('clamps between 0 and 100', () => {
      expect(updateVisibility(0, 'hide', 'Scholar', {})).toBe(0);
      expect(updateVisibility(100, 'expand', 'Scholar', {})).toBeLessThanOrEqual(100);
    });
  });

  describe('calculateAttack', () => {
    it('Warriors have higher success rate', () => {
      let successes = 0;
      for (let i = 0; i < 100; i++) {
        const result = calculateAttack('Warrior', 20, 5, 'Scholar', 10, 80, 8, 100);
        if (result.success) successes++;
      }
      expect(successes).toBeGreaterThan(85);
    });

    it('calculates silver stolen on kill', () => {
      const result = calculateAttack('Warrior', 100, 10, 'Scholar', 5, 1, 0, 1000);
      if (result.success && result.damageDealt >= 1) {
        expect(result.silverStolen).toBeGreaterThan(0);
      }
    });
  });

  describe('canDetect', () => {
    it('Scholar can detect high-visibility targets', () => {
      expect(canDetect(20, 'Scholar', 80, 10)).toBe(true);
    });

    it('cannot detect very stealthy low-visibility targets', () => {
      expect(canDetect(8, 'Warrior', 5, 25)).toBe(false);
    });
  });
});
