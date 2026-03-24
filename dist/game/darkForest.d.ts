import { CharacterClass } from './character';
import { Stance } from './idle';
export interface Threat {
    id: string;
    name: string;
    type: 'bandit' | 'mongol' | 'imperial_guard' | 'ghost' | 'rival';
    attack: number;
    damage: number;
    detectionThreshold: number;
    visibilityRequired: number;
    reward: {
        silver: number;
        xp: number;
    };
}
export declare const THREATS: Threat[];
export interface EncounterResult {
    encountered: boolean;
    threat?: Threat;
    survived?: boolean;
    damageDealt?: number;
    damageTaken?: number;
    reward?: {
        silver: number;
        xp: number;
    };
    message: string;
}
export declare function calculateThreatChance(visibility: number, stance: Stance, region: string, level: number): number;
export declare function selectThreat(visibility: number): Threat;
export declare function resolveEncounter(playerClass: CharacterClass, playerAttack: number, playerDefense: number, playerWisdom: number, playerStealth: number, playerHealth: number, threat: Threat, upgrades: Record<string, number>): EncounterResult;
export declare function updateVisibility(currentVisibility: number, stance: Stance, playerClass: CharacterClass, upgrades: Record<string, number>): number;
export interface AttackResult {
    success: boolean;
    damageDealt: number;
    message: string;
    xpGained: number;
    silverStolen: number;
}
export declare function calculateAttack(attackerClass: CharacterClass, attackerAttack: number, attackerLevel: number, defenderClass: CharacterClass, defenderDefense: number, defenderHealth: number, defenderStealth: number, defenderSilver: number): AttackResult;
export declare function canDetect(detectorWisdom: number, detectorClass: CharacterClass, targetVisibility: number, targetStealth: number): boolean;
//# sourceMappingURL=darkForest.d.ts.map