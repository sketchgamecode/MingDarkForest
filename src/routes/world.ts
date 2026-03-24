import { Router, Request, Response } from 'express';
import { getDb } from '../db/database';
import { getWorldState, REGIONS } from '../game/world';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  const worldState = getWorldState();
  return res.json(worldState);
});

router.get('/leaderboard', (_req: Request, res: Response) => {
  const db = getDb();
  const leaderboard = db.prepare(`
    SELECT l.*, p.region, p.visibility, p.stance, p.alive
    FROM leaderboard l
    JOIN players p ON l.player_id = p.id
    ORDER BY l.score DESC
    LIMIT 20
  `).all();

  return res.json(leaderboard);
});

router.get('/regions', (_req: Request, res: Response) => {
  return res.json(REGIONS);
});

export default router;
