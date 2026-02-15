import { mkdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const DB_PATH = resolve(process.cwd(), 'db', 'app.sqlite');
const MIGRATION_PATH = resolve(process.cwd(), 'db', 'migrations', '001_init.sql');

let db;

function ensureDb() {
  if (db) return db;

  mkdirSync(dirname(DB_PATH), { recursive: true });
  db = new DatabaseSync(DB_PATH);
  db.exec('PRAGMA journal_mode = WAL;');

  const migrationSql = readFileSync(MIGRATION_PATH, 'utf8');
  db.exec(migrationSql);
  return db;
}

export function getDb() {
  return ensureDb();
}

export function nowIso() {
  return new Date().toISOString();
}

export function plusHoursIso(hours) {
  const d = new Date();
  d.setHours(d.getHours() + hours);
  return d.toISOString();
}

export function hasDbFile() {
  return existsSync(DB_PATH);
}
