import { NextRequest, NextResponse } from "next/server";
import { toggleManual } from "@/lib/sync";
import { withUser } from "@/lib/db";
import { getUserId } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as { slug?: string };
  if (!body.slug) {
    return NextResponse.json({ error: "slug required" }, { status: 400 });
  }
  return withUser(userId, async () => {
    const solved = await toggleManual(body.slug!);
    return NextResponse.json({ slug: body.slug, solved });
  });
}
