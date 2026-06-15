// Export a snapshot of the local single-user SQLite DB to JSON, so it can be
// imported into the multi-user cloud app (POST /api/migrate-local).
//
// The source DB is opened READ-ONLY — this never writes to or locks your live
// local app's database.
//
// Usage (run from the cloud copy):
//   node scripts/export-local.mjs "/Users/aditya/Documents/DSA Guardian/data/guardian.db"
// Defaults to ./data/guardian.db and writes ./guardian-export.json
import Database from "better-sqlite3";
import { writeFileSync } from "node:fs";
import path from "node:path";

const dbPath = process.argv[2] || path.join(process.cwd(), "data", "guardian.db");
const outPath = process.argv[3] || path.join(process.cwd(), "guardian-export.json");

const db = new Database(dbPath, { readonly: true, fileMustExist: true });

function all(table) {
  try {
    return db.prepare(`SELECT * FROM ${table}`).all();
  } catch {
    return [];
  }
}

const snapshot = {
  version: 1,
  exportedAt: new Date().toISOString(),
  settings: all("settings"), // includes username, goals, and the LEETCODE_SESSION cookie
  solved: all("solved"),
  daily: all("daily"),
  recommendations: all("recommendations"),
  upsolve: all("upsolve"),
};

db.close();

writeFileSync(outPath, JSON.stringify(snapshot, null, 2));
console.log(
  `Wrote ${outPath}: ${snapshot.solved.length} solved, ${snapshot.daily.length} daily, ` +
    `${snapshot.recommendations.length} recs, ${snapshot.upsolve.length} upsolve, ` +
    `${snapshot.settings.length} settings.`
);
