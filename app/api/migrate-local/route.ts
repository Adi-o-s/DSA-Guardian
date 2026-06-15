import { NextRequest, NextResponse } from "next/server";
import { withUser } from "@/lib/db";
import { getUserId } from "@/lib/auth-helpers";
import { importSnapshot, type Snapshot } from "@/lib/migrate";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const snap = (await req.json().catch(() => null)) as Snapshot | null;
  if (!snap || typeof snap !== "object") {
    return NextResponse.json(
      { error: "Invalid snapshot JSON" },
      { status: 400 }
    );
  }
  return withUser(userId, async () => {
    try {
      const summary = await importSnapshot(snap);
      return NextResponse.json({ ok: true, summary });
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
  });
}
