"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.server = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const database_1 = require("./db/database");
const player_1 = __importDefault(require("./routes/player"));
const world_1 = __importDefault(require("./routes/world"));
const gameLoop_1 = require("./game/gameLoop");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.static(path_1.default.join(process.cwd(), 'public')));
app.use('/api/players', player_1.default);
app.use('/api/world', world_1.default);
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
});
app.get('*', (_req, res) => {
    res.sendFile(path_1.default.join(process.cwd(), 'public', 'index.html'));
});
(0, database_1.getDb)();
(0, gameLoop_1.startGameLoop)();
const server = app.listen(PORT, () => {
    console.log(`Ming Dark Forest server running on http://localhost:${PORT}`);
});
exports.server = server;
exports.default = app;
//# sourceMappingURL=server.js.map