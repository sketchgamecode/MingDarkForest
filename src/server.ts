import express from 'express';
import cors from 'cors';
import path from 'path';
import { getDb } from './db/database';
import playerRoutes from './routes/player';
import worldRoutes from './routes/world';
import { startGameLoop } from './game/gameLoop';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(process.cwd(), 'public')));

app.use('/api/players', playerRoutes);
app.use('/api/world', worldRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

getDb();
startGameLoop();

const server = app.listen(PORT, () => {
  console.log(`Ming Dark Forest server running on http://localhost:${PORT}`);
});

export default app;
export { server };
