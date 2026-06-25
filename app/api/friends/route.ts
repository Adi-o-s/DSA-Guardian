import { NextRequest, NextResponse } from "next/server";
import { withUser } from "@/lib/db";
import { getUserId } from "@/lib/auth-helpers";
import { addFriend, listFriends, removeFriend } from "@/lib/leaderboard";

export const dynamic = "force-dynamic";

async function authed<T>(fn: (userId: string) => Promise<T>) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return withUser(userId, async () => {
    try {
      return NextResponse.json(await fn(userId));
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 400 });
    }
  });
}

export async function GET() {
  return authed(async () => ({ friends: await listFriends() }));
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { username?: string };
  return authed(async () => ({ friend: await addFriend(body.username ?? "") }));
}

export async function DELETE(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as { friendId?: string };
  return authed(async () => {
    if (!body.friendId) throw new Error("Missing friendId.");
    await removeFriend(body.friendId);
    return { ok: true };
  });
}
