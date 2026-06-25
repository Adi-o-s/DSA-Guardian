import { NextResponse } from "next/server";
import { withUser } from "@/lib/db";
import { getUserId } from "@/lib/auth-helpers";
import { solvedHeatmap, tagMastery } from "@/lib/stats";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return withUser(userId, async () => {
    try {
      const [heatmap, tags] = await Promise.all([solvedHeatmap(), tagMastery()]);
      return NextResponse.json({ heatmap, tags });
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
  });
}
