"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDb = getDb;
exports.initializeSchema = initializeSchema;
exports.closeDb = closeDb;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
const DB_PATH = path_1.default.join(process.cwd(), 'game.db');
let db;
function getDb() {
    if (!db) {
        db = new better_sqlite3_1.default(DB_PATH);
        db.pragma('journal_mode = WAL');
        db.pragma('foreign_keys = ON');
        initializeSchema(db);
    }
    return db;
}
function initializeSchema(database) {
    database.exec(`
    CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      class TEXT NOT NULL,
      level INTEGER NOT NULL DEFAULT 1,
      xp INTEGER NOT NULL DEFAULT 0,
      health INTEGER NOT NULL DEFAULT 100,
      max_health INTEGER NOT NULL DEFAULT 100,
      attack INTEGER NOT NULL DEFAULT 10,
      defense INTEGER NOT NULL DEFAULT 10,
      wisdom INTEGER NOT NULL DEFAULT 10,
      stealth INTEGER NOT NULL DEFAULT 10,
      silver REAL NOT NULL DEFAULT 0,
      knowledge REAL NOT NULL DEFAULT 0,
      supplies REAL NOT NULL DEFAULT 0,
      qi REAL NOT NULL DEFAULT 0,
      visibility INTEGER NOT NULL DEFAULT 50,
      stance TEXT NOT NULL DEFAULT 'balanced',
      region TEXT NOT NULL DEFAULT 'Imperial Capital',
      last_tick INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      last_active INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      alive INTEGER NOT NULL DEFAULT 1,
      upgrades TEXT NOT NULL DEFAULT '{}',
      kills INTEGER NOT NULL DEFAULT 0,
      deaths INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      message TEXT NOT NULL,
      player_id TEXT,
      data TEXT,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (player_id) REFERENCES players(id)
    );

    CREATE TABLE IF NOT EXISTS leaderboard (
      player_id TEXT PRIMARY KEY,
      player_name TEXT NOT NULL,
      player_class TEXT NOT NULL,
      level INTEGER NOT NULL DEFAULT 1,
      total_silver REAL NOT NULL DEFAULT 0,
      kills INTEGER NOT NULL DEFAULT 0,
      survival_days INTEGER NOT NULL DEFAULT 0,
      score INTEGER NOT NULL DEFAULT 0,
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (player_id) REFERENCES players(id)
    );

    CREATE TABLE IF NOT EXISTS world_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      effect TEXT NOT NULL,
      region TEXT,
      duration INTEGER NOT NULL DEFAULT 300,
      started_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      active INTEGER NOT NULL DEFAULT 1
    );
  `);
}
function closeDb() {
    if (db) {
        db.close();
    }
}
//# sourceMappingURL=database.js.map