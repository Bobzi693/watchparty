import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(__dirname, '..', 'data', 'watchparty.db');

let db: Database.Database;

export function initDatabase(): void {
  const fs = require('fs');
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      current_video_url TEXT,
      current_video_platform TEXT,
      current_video_time REAL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      room_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      text TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      FOREIGN KEY (room_id) REFERENCES rooms(id)
    );
  `);
}

export function createRoom(id: string, name: string): void {
  const stmt = db.prepare('INSERT INTO rooms (id, name, created_at) VALUES (?, ?, ?)');
  stmt.run(id, name, Date.now());
}

export function getRoom(id: string): any {
  return db.prepare('SELECT * FROM rooms WHERE id = ?').get(id);
}

export function deleteRoom(id: string): void {
  db.prepare('DELETE FROM messages WHERE room_id = ?').run(id);
  db.prepare('DELETE FROM rooms WHERE id = ?').run(id);
}

export function saveMessage(id: string, roomId: string, userId: string, userName: string, text: string, timestamp: number): void {
  db.prepare('INSERT INTO messages (id, room_id, user_id, user_name, text, timestamp) VALUES (?, ?, ?, ?, ?, ?)').run(id, roomId, userId, userName, text, timestamp);
}

export function getMessages(roomId: string, limit = 50): any[] {
  return db.prepare('SELECT * FROM messages WHERE room_id = ? ORDER BY timestamp DESC LIMIT ?').all(roomId, limit).reverse();
}

export function updateRoomVideo(roomId: string, url: string, platform: string, time: number): void {
  db.prepare('UPDATE rooms SET current_video_url = ?, current_video_platform = ?, current_video_time = ? WHERE id = ?').run(url, platform, time, roomId);
}
