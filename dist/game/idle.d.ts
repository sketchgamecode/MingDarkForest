import { CharacterClass } from './character';
export type Stance = 'hide' | 'balanced' | 'expand';
export interface Resources {
    silver: number;
    knowledge: number;
    supplies: number;
    qi: number;
}
export interface ResourceTick {
    silver: number;
    knowledge: number;
    supplies: number;
    qi: number;
    xp: number;
}
export type UpgradeId = 'silver_boost' | 'knowledge_boost' | 'supplies_boost' | 'qi_boost' | 'stealth_cloak' | 'fortification' | 'trade_network';
export interface Upgrade {
    id: UpgradeId;
    name: string;
    description: string;
    cost: Resources;
    effect: string;
    maxLevel: number;
}
export declare const UPGRADES: Record<UpgradeId, Upgrade>;
export declare const REGION_BONUSES: Record<string, Partial<Resources> & {
    threatMultiplier: number;
}>;
export declare function calculateResourceTick(playerClass: CharacterClass, level: number, stance: Stance, region: string, visibility: number, upgrades: Record<string, number>, elapsedSeconds: number): ResourceTick;
export declare function calculateOfflineProgress(playerClass: CharacterClass, level: number, stance: Stance, region: string, visibility: number, upgrades: Record<string, number>, lastTick: number): ResourceTick;
export declare function canAffordUpgrade(resources: Resources, upgradeId: UpgradeId, currentLevel: number): boolean;
export declare function applyUpgradeCost(resources: Resources, upgradeId: UpgradeId, currentLevel: number): Resources;
//# sourceMappingURL=idle.d.ts.map