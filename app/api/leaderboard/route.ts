import { NextRequest, NextResponse } from "next/server";
import { withUser } from "@/lib/db";
import { getUserId } from "@/lib/auth-helpers";
import { friendsBoard, globalBoard } from "@/lib/leaderboard";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const scope = req.nextUrl.searchParams.get("scope") === "friends" ? "friends" : "global";
  return withUser(userId, async () => {
    try {
      const rows = scope === "friends" ? await friendsBoard() : await globalBoard();
      return NextResponse.json({ scope, rows });
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
  });
}
