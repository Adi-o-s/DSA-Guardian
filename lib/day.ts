// Computes the current "LeetCode day" (YYYY-MM-DD). Default offset 0 = UTC,
// which is when LeetCode's daily resets. A positive offset shifts the boundary
// (e.g. 330 = IST midnight).
import { getSetting } from "./db";

async function offsetMinutes(): Promise<number> {
  return parseInt((await getSetting("dayOffsetMinutes")) || "0", 10) || 0;
}

export async function lcDate(at: number = Date.now()): Promise<string> {
  const offsetMin = await offsetMinutes();
  const shifted = new Date(at + offsetMin * 60_000);
  const y = shifted.getUTCFullYear();
  const m = String(shifted.getUTCMonth() + 1).padStart(2, "0");
  const d = String(shifted.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Start-of-day epoch ms for the current LeetCode day (for "solved today"). */
export async function lcDayStart(at: number = Date.now()): Promise<number> {
  const offsetMin = await offsetMinutes();
  const shifted = new Date(at + offsetMin * 60_000);
  const startUtc = Date.UTC(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth(),
    shifted.getUTCDate()
  );
  return startUtc - offsetMin * 60_000;
}
