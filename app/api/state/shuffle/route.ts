import { NextResponse } from "next/server";
import { withUser } from "@/lib/db";
import { getUserId } from "@/lib/auth-helpers";
import { buildState } from "@/lib/state";
import { shuffleDaily } from "@/lib/recommend";
import { lcDate } from "@/lib/day";

export const dynamic = "force-dynamic";

export async function POST() {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return withUser(userId, async () => {
    try {
      const date = await lcDate();
      await shuffleDaily(date);
      return NextResponse.json(await buildState());
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
  });
}
