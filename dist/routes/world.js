"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const database_1 = require("../db/database");
const world_1 = require("../game/world");
const router = (0, express_1.Router)();
router.get('/', (_req, res) => {
    const worldState = (0, world_1.getWorldState)();
    return res.json(worldState);
});
router.get('/leaderboard', (_req, res) => {
    const db = (0, database_1.getDb)();
    const leaderboard = db.prepare(`
    SELECT l.*, p.region, p.visibility, p.stance, p.alive
    FROM leaderboard l
    JOIN players p ON l.player_id = p.id
    ORDER BY l.score DESC
    LIMIT 20
  `).all();
    return res.json(leaderboard);
});
router.get('/regions', (_req, res) => {
    return res.json(world_1.REGIONS);
});
exports.default = router;
//# sourceMappingURL=world.js.map