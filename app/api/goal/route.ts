import { NextRequest, NextResponse } from "next/server";
import { lcDate } from "@/lib/day";
import { ensureDaily, setGoal } from "@/lib/recommend";
import { withUser } from "@/lib/db";
import { getUserId } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return withUser(userId, async () => {
    const date = await lcDate();
    const daily = await ensureDaily(date);
    return NextResponse.json({ lcDate: date, goal: daily.goal });
  });
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as { goal?: number };
  const goal = Math.max(1, Math.min(50, Math.floor(Number(body.goal) || 0)));
  if (!goal) {
    return NextResponse.json({ error: "Invalid goal" }, { status: 400 });
  }
  return withUser(userId, async () => {
    const date = await lcDate();
    await setGoal(date, goal);
    return NextResponse.json({ lcDate: date, goal });
  });
}
