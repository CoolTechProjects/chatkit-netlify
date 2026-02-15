import { getDb } from '../netlify/functions/_lib/db.mjs';

const db = getDb();
const rows = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
console.log('tables:', rows.map((r) => r.name).join(', '));
