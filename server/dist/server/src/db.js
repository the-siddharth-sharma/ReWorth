import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}
const DB_PATH = path.join(DATA_DIR, 'reworth.sqlite');
export const db = new DatabaseSync(DB_PATH);
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    account_type TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member',
    organization TEXT,
    area TEXT NOT NULL,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    interests_json TEXT NOT NULL,
    bio TEXT,
    is_demo INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS resources (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    material_tags_json TEXT NOT NULL,
    quantity REAL NOT NULL,
    unit TEXT NOT NULL,
    condition TEXT NOT NULL,
    transfer_type TEXT NOT NULL,
    price_amount REAL,
    exchange_note TEXT,
    area TEXT NOT NULL,
    pickup_instructions TEXT NOT NULL,
    availability TEXT NOT NULL,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    disposal_date TEXT NOT NULL,
    urgency TEXT NOT NULL,
    image_url TEXT,
    safety_confirmed INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'available',
    is_sample INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS needs (
    id TEXT PRIMARY KEY,
    requester_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    material_tags_json TEXT NOT NULL,
    quantity REAL NOT NULL,
    unit TEXT NOT NULL,
    purpose TEXT NOT NULL,
    area TEXT NOT NULL,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    deadline TEXT NOT NULL,
    preferred_transfer TEXT NOT NULL,
    max_budget REAL,
    status TEXT NOT NULL DEFAULT 'open',
    is_sample INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS exchanges (
    id TEXT PRIMARY KEY,
    resource_id TEXT NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    need_id TEXT,
    owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    requester_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    requested_quantity REAL NOT NULL,
    unit TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    initial_note TEXT NOT NULL,
    owner_note TEXT,
    estimated_kg REAL NOT NULL,
    is_sample INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS exchange_messages (
    id TEXT PRIMARY KEY,
    exchange_id TEXT NOT NULL REFERENCES exchanges(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    reporter_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    details TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    moderator_note TEXT,
    created_at TEXT NOT NULL,
    resolved_at TEXT
  );
`);
