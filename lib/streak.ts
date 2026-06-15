// Streak = consecutive LeetCode days the daily QUESTIONS goal was met.
import { currentUserId, query } from "./db";
import { lcDate, lcDayStart } from "./day";
import { ensureDaily, getDaily } from "./recommend";

/** Persist today's progress and latch `met` once the questions goal is reached. */
export async function markDayProgress(
  date: string,
  solvedToday: number,
  goal: number
): Promise<void> {
  await ensureDaily(date);
  const userId = currentUserId();
  const metNow = solvedToday >= goal ? 1 : 0;
  await query(
    `UPDATE daily
     SET completed_count = $1,
         met = CASE WHEN met = 1 THEN 1 ELSE $2 END
     WHERE user_id = $3 AND lc_date = $4`,
    [solvedToday, metNow, userId, date]
  );
}

/** Count back from today over consecutive met days. An unmet *today* doesn't
 *  break the streak (the day isn't over) — we just start counting yesterday. */
export async function computeStreak(): Promise<number> {
  let streak = 0;
  let cursor = Date.now();

  const today = await lcDate(cursor);
  const todayRow = await getDaily(today);
  if (todayRow?.met) {
    streak++;
  }
  cursor = (await lcDayStart(cursor)) - 1; // step into yesterday

  while (true) {
    const d = await lcDate(cursor);
    const row = await getDaily(d);
    if (row?.met) {
      streak++;
      cursor = (await lcDayStart(cursor)) - 1;
    } else {
      break;
    }
  }
  return streak;
}
