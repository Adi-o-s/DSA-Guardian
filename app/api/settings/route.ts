import { NextRequest, NextResponse } from "next/server";
import { getAllSettings, hasCookie, setSetting, withUser } from "@/lib/db";
import { getCompany } from "@/lib/data";
import { getUserId } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

let _companies: string[] | null = null;
function allCompanies(): string[] {
  if (_companies) return _companies;
  const set = new Set<string>();
  for (const entry of Object.values(getCompany())) {
    for (const c of Object.keys(entry.companies)) set.add(c);
  }
  return (_companies = [...set].sort());
}

const EDITABLE = new Set([
  "username",
  "dailyGoalDefault",
  "hardGoal",
  "completionThreshold",
  "dayOffsetMinutes",
  "sheetOrder",
  "selectedCompanies",
  "leaderboardPublic",
  "cookie",
]);

export async function GET() {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return withUser(userId, async () => {
    const s = await getAllSettings();
    return NextResponse.json({
      settings: {
        username: s.username,
        dailyGoalDefault: s.dailyGoalDefault,
        hardGoal: s.hardGoal,
        completionThreshold: s.completionThreshold,
        dayOffsetMinutes: s.dayOffsetMinutes,
        sheetOrder: s.sheetOrder,
        selectedCompanies: s.selectedCompanies,
        leaderboardPublic: s.leaderboardPublic,
        hasCookie: await hasCookie(),
      },
      companies: allCompanies(),
    });
  });
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as Record<string, string>;
  return withUser(userId, async () => {
    for (const [k, v] of Object.entries(body)) {
      if (EDITABLE.has(k)) await setSetting(k, String(v ?? ""));
    }
    return NextResponse.json({ ok: true });
  });
}
