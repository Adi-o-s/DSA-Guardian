import { NextResponse } from "next/server";
import { currentUserId, getSetting, query, withUser } from "@/lib/db";
import { getMeta, getSheet } from "@/lib/data";
import { stepProgress } from "@/lib/sync";
import { orderSteps, roadmapTopic, type SheetOrder } from "@/lib/roadmap";
import { getUserId } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return withUser(userId, async () => {
    const sheet = getSheet();
    const meta = getMeta();
    const order = ((await getSetting("sheetOrder")) || "neetcode") as SheetOrder;
    const progress = new Map((await stepProgress()).map((s) => [s.id, s]));
    const solvedRows = await query<{ slug: string; source: string }>(
      "SELECT slug, source FROM solved WHERE user_id = $1",
      [currentUserId()]
    );
    const solved = new Map(solvedRows.map((r) => [r.slug, r.source]));

    const steps = orderSteps(sheet.steps, order).map((step) => {
      const p = progress.get(step.id)!;
      return {
        id: step.id,
        title: step.title,
        subtitle: step.subtitle,
        roadmap: roadmapTopic(step.id),
        total: p.total,
        solved: p.solved,
        pct: p.pct,
        complete: p.complete,
        categories: step.categories.map((cat) => ({
          id: cat.id,
          title: cat.title,
          problems: cat.problems.map((q) => ({
            id: q.id,
            title: q.title,
            slug: q.slug,
            leetcode: q.leetcode,
            gfg: q.gfg,
            yt: q.yt,
            difficulty: q.slug ? meta[q.slug]?.difficulty ?? null : null,
            solved: q.slug ? solved.has(q.slug) : false,
            source: q.slug ? solved.get(q.slug) ?? null : null,
          })),
        })),
      };
    });

    return NextResponse.json({ name: sheet.name, steps });
  });
}
