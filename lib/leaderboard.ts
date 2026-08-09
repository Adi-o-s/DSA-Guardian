// The ONLY cross-user reads in the app. Everything here exposes safe, public
// columns only — github_username, avatar, current streak, weekly solve count —
// never another user's solved list, settings, or cookie. The global board shows
// every registered user; the friends board shows you + people you follow.
import { currentUserId, query } from "./db";
import { lcDate, lcDayStart } from "./day";

export type LeaderRow = {
  userId: string;
  username: string | null;
  image: string | null;
  streak: number;
  weekly: number;
  isMe: boolean;
};

type Member = { id: string; github_username: string | null; image: string | null };

/** userId -> weekly solve count, over the last 7 LeetCode days (all users). */
async function weeklyCounts(): Promise<Map<string, number>> {
  const weekStart = (await lcDayStart()) - 6 * 86_400_000;
  const rows = await query<{ user_id: string; n: string }>(
    `SELECT user_id, COUNT(*) AS n FROM solved
     WHERE solved_at >= $1 GROUP BY user_id`,
    [weekStart]
  );
  return new Map(rows.map((r) => [r.user_id, Number(r.n)]));
}

/**
 * userId -> current streak (consecutive met days ending today or yesterday),
 * computed for all users in one gaps-and-islands pass over `daily`.
 */
async function streaks(): Promise<Map<string, number>> {
  const today = await lcDate();
  const rows = await query<{ user_id: string; streak: string }>(
    `WITH met_days AS (
       SELECT user_id, lc_date::date AS d FROM daily WHERE met = 1
     ),
     islands AS (
       SELECT user_id, d,
              d - (ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY d))::int AS grp
       FROM met_days
     ),
     runs AS (
       SELECT user_id, COUNT(*) AS len, MAX(d) AS last_day
       FROM islands GROUP BY user_id, grp
     )
     SELECT user_id, len AS streak FROM runs
     WHERE last_day >= ($1::date - 1)`,
    [today]
  );
  return new Map(rows.map((r) => [r.user_id, Number(r.streak)]));
}

function rank(rows: LeaderRow[]): LeaderRow[] {
  return rows.sort((a, b) => b.streak - a.streak || b.weekly - a.weekly);
}

// Weekly + streak are fetched once for all users, then joined.
async function assemble(members: Member[]): Promise<LeaderRow[]> {
  const me = currentUserId();
  const [weekly, streak] = await Promise.all([weeklyCounts(), streaks()]);
  const rows = members.map<LeaderRow>((m) => ({
    userId: m.id,
    username: m.github_username,
    image: m.image,
    isMe: m.id === me,
    streak: streak.get(m.id) ?? 0,
    weekly: weekly.get(m.id) ?? 0,
  }));
  return rank(rows);
}

/** Global board: every registered user. */
export async function globalBoard(): Promise<LeaderRow[]> {
  const members = await query<Member>(
    `SELECT id, github_username, image FROM users`
  );
  return assemble(members);
}

/** Friends board: you + everyone you follow. */
export async function friendsBoard(): Promise<LeaderRow[]> {
  const me = currentUserId();
  const members = await query<Member>(
    `SELECT u.id, u.github_username, u.image
     FROM users u
     WHERE u.id = $1
        OR u.id IN (SELECT friend_id FROM friends WHERE user_id = $1)`,
    [me]
  );
  return assemble(members);
}

// ---- friend (follow) management — scoped to the acting user ----

export type FriendInfo = { userId: string; username: string | null; image: string | null };

/** People the current user follows. */
export async function listFriends(): Promise<FriendInfo[]> {
  const me = currentUserId();
  const rows = await query<Member>(
    `SELECT u.id, u.github_username, u.image
     FROM friends f JOIN users u ON u.id = f.friend_id
     WHERE f.user_id = $1
     ORDER BY u.github_username`,
    [me]
  );
  return rows.map((r) => ({ userId: r.id, username: r.github_username, image: r.image }));
}

/** Follow a user by GitHub username. Throws if unknown or self. */
export async function addFriend(username: string): Promise<FriendInfo> {
  const me = currentUserId();
  const handle = username.trim().replace(/^@/, "");
  if (!handle) throw new Error("Enter a GitHub username.");
  const found = await query<Member>(
    "SELECT id, github_username, image FROM users WHERE lower(github_username) = lower($1)",
    [handle]
  );
  if (found.length === 0) {
    throw new Error(`No DSA Guardian user with GitHub username "${handle}".`);
  }
  const target = found[0];
  if (target.id === me) throw new Error("You can't add yourself.");
  await query(
    `INSERT INTO friends (user_id, friend_id) VALUES ($1, $2)
     ON CONFLICT (user_id, friend_id) DO NOTHING`,
    [me, target.id]
  );
  return { userId: target.id, username: target.github_username, image: target.image };
}

/** Unfollow a user by their app id. */
export async function removeFriend(friendId: string): Promise<void> {
  const me = currentUserId();
  await query("DELETE FROM friends WHERE user_id = $1 AND friend_id = $2", [me, friendId]);
}
