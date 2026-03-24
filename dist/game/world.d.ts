export declare const REGIONS: readonly [{
    readonly name: "Imperial Capital";
    readonly description: "The heart of Ming power. High rewards but constant surveillance.";
    readonly threatLevel: "High";
    readonly specialResource: "Silver";
    readonly icon: "🏯";
}, {
    readonly name: "Silk Road";
    readonly description: "Ancient trade routes. Massive silver potential but dangerous.";
    readonly threatLevel: "Very High";
    readonly specialResource: "Silver";
    readonly icon: "🐪";
}, {
    readonly name: "Yangtze Delta";
    readonly description: "Fertile lands by the great river. Balanced and relatively safe.";
    readonly threatLevel: "Medium";
    readonly specialResource: "Supplies";
    readonly icon: "🌊";
}, {
    readonly name: "Mountain Hermitage";
    readonly description: "Remote peaks where masters meditate. Low threat, high Qi.";
    readonly threatLevel: "Low";
    readonly specialResource: "Qi";
    readonly icon: "⛰️";
}, {
    readonly name: "Forbidden City";
    readonly description: "Imperial palace grounds. Extreme knowledge but restricted access.";
    readonly threatLevel: "Low";
    readonly specialResource: "Knowledge";
    readonly icon: "🔮";
}];
export type RegionName = typeof REGIONS[number]['name'];
export interface WorldEvent {
    id: number;
    type: string;
    name: string;
    description: string;
    effect: string;
    region: string | null;
    duration: number;
    startedAt: number;
    active: boolean;
}
export declare function getActiveWorldEvents(): WorldEvent[];
export declare function triggerRandomWorldEvent(): WorldEvent | null;
export declare function getWorldEventMultipliers(playerRegion: string, activeEvents: WorldEvent[]): {
    silverMultiplier: number;
    knowledgeMultiplier: number;
    xpMultiplier: number;
    threatMultiplier: number;
    resourceMultiplier: number;
    visibilityIncrease: number;
};
export declare function getWorldState(): {
    regions: ({
        playerCount: number;
        name: "Imperial Capital";
        description: "The heart of Ming power. High rewards but constant surveillance.";
        threatLevel: "High";
        specialResource: "Silver";
        icon: "🏯";
    } | {
        playerCount: number;
        name: "Silk Road";
        description: "Ancient trade routes. Massive silver potential but dangerous.";
        threatLevel: "Very High";
        specialResource: "Silver";
        icon: "🐪";
    } | {
        playerCount: number;
        name: "Yangtze Delta";
        description: "Fertile lands by the great river. Balanced and relatively safe.";
        threatLevel: "Medium";
        specialResource: "Supplies";
        icon: "🌊";
    } | {
        playerCount: number;
        name: "Mountain Hermitage";
        description: "Remote peaks where masters meditate. Low threat, high Qi.";
        threatLevel: "Low";
        specialResource: "Qi";
        icon: "⛰️";
    } | {
        playerCount: number;
        name: "Forbidden City";
        description: "Imperial palace grounds. Extreme knowledge but restricted access.";
        threatLevel: "Low";
        specialResource: "Knowledge";
        icon: "🔮";
    })[];
    activeEvents: WorldEvent[];
    recentEvents: {
        type: string;
        message: string;
        createdAt: number;
    }[];
    timestamp: number;
};
//# sourceMappingURL=world.d.ts.map