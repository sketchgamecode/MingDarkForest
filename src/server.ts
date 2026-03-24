import express from 'express';
import cors from 'cors';
import path from 'path';
import rateLimit from 'express-rate-limit';
import { getDb } from './db/database';
import playerRoutes from './routes/player';
import worldRoutes from './routes/world';
import { startGameLoop } from './game/gameLoop';

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiting: prevent API abuse (important for MMO fairness and DoS protection)
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,             // 60 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down.' },
});

const createPlayerLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5, // 5 new players per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many account creation attempts, please try again later.' },
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(process.cwd(), 'public')));

app.use('/api/players', apiLimiter, playerRoutes);
app.use('/api/world', apiLimiter, worldRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Apply stricter rate limit to player creation
app.post('/api/players', createPlayerLimiter);

// Rate limit for static file serving (prevents DoS via rapid page loads)
const staticLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

app.get('*path', staticLimiter, (_req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

getDb();
startGameLoop();

const server = app.listen(PORT, () => {
  console.log(`Ming Dark Forest server running on http://localhost:${PORT}`);
});

export default app;
export { server };
