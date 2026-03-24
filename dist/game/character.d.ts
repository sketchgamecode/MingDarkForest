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
export declare const CLASS_DEFINITIONS: Record<CharacterClass, ClassDefinition>;
export declare function getXpRequired(level: number): number;
export declare function getStatBonusForLevel(level: number): Partial<CharacterStats>;
export declare function applyLevelBonuses(baseStats: CharacterStats, level: number): CharacterStats;
export declare function calculateLevel(xp: number): number;
export declare function getVisibilityDescription(visibility: number): string;
export declare function getVisibilityTier(visibility: number): 1 | 2 | 3 | 4;
//# sourceMappingURL=character.d.ts.map