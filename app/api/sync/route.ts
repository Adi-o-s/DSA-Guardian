import { NextResponse } from "next/server";
import { runSync } from "@/lib/sync";
import { buildState } from "@/lib/state";
import { withUser } from "@/lib/db";
import { getUserId } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function POST() {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return withUser(userId, async () => {
    try {
      const result = await runSync();
      return NextResponse.json({ sync: result, state: await buildState() });
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 400 });
    }
  });
}
