// Idempotent migration runner. Applies every migrations/*.sql in filename order
// and records applied files in a _migrations table so re-runs are no-ops.
//
// Usage: DATABASE_URL=postgres://... node scripts/migrate.mjs
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, "..", "migrations");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const ssl =
  process.env.PGSSL === "disable"
    ? false
    : connectionString.includes("localhost") || connectionString.includes("127.0.0.1")
      ? false
      : { rejectUnauthorized: false };

const client = new pg.Client({ connectionString, ssl });

async function main() {
  await client.connect();
  await client.query(
    `CREATE TABLE IF NOT EXISTS _migrations (
       name TEXT PRIMARY KEY,
       applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
     )`
  );

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const applied = new Set(
    (await client.query("SELECT name FROM _migrations")).rows.map((r) => r.name)
  );

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`= skip ${file} (already applied)`);
      continue;
    }
    const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
    console.log(`+ applying ${file} ...`);
    await client.query("BEGIN");
    try {
      await client.query(sql);
      await client.query("INSERT INTO _migrations (name) VALUES ($1)", [file]);
      await client.query("COMMIT");
      console.log(`  done ${file}`);
    } catch (e) {
      await client.query("ROLLBACK");
      console.error(`  FAILED ${file}:`, e.message);
      throw e;
    }
  }
  console.log("All migrations applied.");
}

main()
  .then(() => client.end())
  .catch((e) => {
    console.error(e);
    client.end();
    process.exit(1);
  });
