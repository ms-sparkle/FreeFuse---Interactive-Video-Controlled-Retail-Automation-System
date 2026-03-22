import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'data', 'capstone.db');
const SQL_PATH = path.join(process.cwd(), 'app', 'Database', 'cse-capstonedb-32226.db.sql');

let db: Database.Database | null = null;

export default function getDb(): Database.Database {
  if (db) return db;

  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const isNew = !fs.existsSync(DB_PATH);
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');

  // Seed first (with FK checks off), then enable FK enforcement
  if (isNew && fs.existsSync(SQL_PATH)) {
    const sql = fs.readFileSync(SQL_PATH, 'utf8');
    db.pragma('foreign_keys = OFF');
    db.exec(sql);
  }

  db.pragma('foreign_keys = ON');
  return db;
}
