import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Store the DB file in the project's `data/` directory
const DB_PATH = path.join(process.cwd(), 'data', 'capstone.db');
const SQL_PATH = path.join(process.cwd(), 'app', 'Database', 'cse-capstonedb-32226.db.sql');

let db: Database.Database;

function getDb(): Database.Database {
  if (db) return db;

  // Ensure the data directory exists
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const isNew = !fs.existsSync(DB_PATH);
  db = new Database(DB_PATH);

  // Enable WAL mode for better performance
  db.pragma('journal_mode = WAL');

  if (isNew) {
    // Seed from SQL file. Disable FK enforcement during seeding because the
    // INSERT order in the SQL file doesn't match dependency order.
    const sql = fs.readFileSync(SQL_PATH, 'utf-8');
    db.pragma('foreign_keys = OFF');
    db.exec(sql);
    db.pragma('foreign_keys = ON');
  } else {
    db.pragma('foreign_keys = ON');
  }

  return db;
}

export default getDb;
