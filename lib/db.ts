import "server-only";
// Multi-user Postgres persistence. Every query is scoped to the authenticated
// user via request-scoped context (AsyncLocalStorage). `currentUserId()` THROWS
// if no user is in scope, so a query can never accidentally run unscoped — this
// is the backbone of cross-user data isolation.
import { Pool } from "pg";
import { AsyncLocalStorage } from "node:async_hooks";
import { decryptSecret, encryptSecret } from "./crypto";

declare global {
  // eslint-disable-next-line no-var
  var __guardianPool: Pool | undefined;
}

export function pool(): Pool {
  if (!global.__guardianPool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error("DATABASE_URL is not set");
    const local =
      connectionString.includes("localhost") ||
      connectionString.includes("127.0.0.1");
    global.__guardianPool = new Pool({
      connectionString,
      max: 5,
      ssl:
        process.env.PGSSL === "disable" || local
          ? false
          : { rejectUnauthorized: false },
    });
  }
  return global.__guardianPool;
}

/** Run `rows`-returning SQL. Callers must include `user_id` in the SQL/params. */
export async function query<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  const res = await pool().query(text, params);
  return res.rows as T[];
}

// ---- request-scoped user context ----
const userCtx = new AsyncLocalStorage<{ userId: string }>();

/** Bind a userId for the duration of `fn`. Set once at each API route boundary. */
export function withUser<T>(userId: string, fn: () => Promise<T>): Promise<T> {
  return userCtx.run({ userId }, fn);
}

/** The authenticated user's id, or throw if none is in scope. */
export function currentUserId(): string {
  const ctx = userCtx.getStore();
  if (!ctx?.userId) {
    throw new Error(
      "No user in context — a DB query ran outside withUser(). This is a bug."
    );
  }
  return ctx.userId;
}

// ---- settings ----
export const DEFAULT_SETTINGS: Record<string, string> = {
  username: "",
  dailyGoalDefault: "2", // daily QUESTIONS goal (any difficulty), asked each day
  hardGoal: "2", // daily HARD-questions goal, configured in settings
  completionThreshold: "80", // percent of a step's LC-linked problems to call it "complete"
  dayOffsetMinutes: "0", // 0 = UTC (LeetCode reset)
  sheetOrder: "neetcode", // 'neetcode' (roadmap flow) | 'a2z' (original order)
  selectedCompanies: "", // comma-separated; empty = all companies
  leaderboardPublic: "0", // '1' = appear on the global leaderboard
  cookie: "", // LEETCODE_SESSION value for optional full sync (stored ENCRYPTED)
};

// The cookie is sensitive: encrypted at rest and never returned by the generic
// settings readers. Use getCookie()/setCookie() instead.
const SECRET_KEYS = new Set(["cookie"]);

export async function getSetting(key: string): Promise<string> {
  const userId = currentUserId();
  const rows = await query<{ value: string }>(
    "SELECT value FROM settings WHERE user_id = $1 AND key = $2",
    [userId, key]
  );
  return rows[0]?.value ?? DEFAULT_SETTINGS[key] ?? "";
}

/** All non-secret settings, merged over defaults. Excludes the cookie. */
export async function getAllSettings(): Promise<Record<string, string>> {
  const userId = currentUserId();
  const rows = await query<{ key: string; value: string }>(
    "SELECT key, value FROM settings WHERE user_id = $1",
    [userId]
  );
  const out: Record<string, string> = { ...DEFAULT_SETTINGS };
  delete out.cookie;
  for (const r of rows) {
    if (SECRET_KEYS.has(r.key)) continue;
    out[r.key] = r.value;
  }
  return out;
}

export async function setSetting(key: string, value: string): Promise<void> {
  if (SECRET_KEYS.has(key)) {
    await setCookie(value);
    return;
  }
  const userId = currentUserId();
  await query(
    `INSERT INTO settings (user_id, key, value) VALUES ($1, $2, $3)
     ON CONFLICT (user_id, key) DO UPDATE SET value = EXCLUDED.value`,
    [userId, key, value]
  );
}

/** Decrypted LEETCODE_SESSION cookie ("" if none). */
export async function getCookie(): Promise<string> {
  const userId = currentUserId();
  const rows = await query<{ value: string }>(
    "SELECT value FROM settings WHERE user_id = $1 AND key = 'cookie'",
    [userId]
  );
  return decryptSecret(rows[0]?.value ?? "");
}

/** Store the cookie encrypted at rest. Empty clears it. */
export async function setCookie(plaintext: string): Promise<void> {
  const userId = currentUserId();
  const encrypted = encryptSecret(plaintext.trim());
  await query(
    `INSERT INTO settings (user_id, key, value) VALUES ($1, 'cookie', $2)
     ON CONFLICT (user_id, key) DO UPDATE SET value = EXCLUDED.value`,
    [userId, encrypted]
  );
}

export async function hasCookie(): Promise<boolean> {
  return (await getCookie()).length > 0;
}

// ---- user provisioning (called from auth on sign-in) ----
export type AppUser = {
  id: string;
  github_id: string | null;
  github_username: string | null;
  email: string | null;
};

/** Upsert a user by GitHub id and return their app UUID. */
export async function upsertUserByGithub(input: {
  githubId: string | number;
  username?: string | null;
  email?: string | null;
  name?: string | null;
  image?: string | null;
}): Promise<AppUser> {
  const rows = await query<AppUser>(
    `INSERT INTO users (github_id, github_username, email, name, image)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (github_id) DO UPDATE SET
       github_username = EXCLUDED.github_username,
       email = COALESCE(EXCLUDED.email, users.email),
       name = COALESCE(EXCLUDED.name, users.name),
       image = COALESCE(EXCLUDED.image, users.image),
       updated_at = now()
     RETURNING id, github_id, github_username, email`,
    [
      String(input.githubId),
      input.username ?? null,
      input.email ?? null,
      input.name ?? null,
      input.image ?? null,
    ]
  );
  return rows[0];
}
