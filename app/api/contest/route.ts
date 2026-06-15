import { NextRequest, NextResponse } from "next/server";
import {
  buildRecoveryPlan,
  setAttempted,
  setConquered,
  topicLookup,
} from "@/lib/contest";
import { withUser } from "@/lib/db";
import { getUserId } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

// Accept a full contest URL or a bare slug, e.g.
// "https://leetcode.com/contest/weekly-contest-380/" -> "weekly-contest-380".
function normalizeSlug(raw: string): string {
  const v = raw.trim().replace(/\/+$/, "");
  const m = v.match(/contest\/([^/]+)/);
  return (m ? m[1] : v).trim();
}

// Manual topic picker (tagsPending edge case): recompute videos + practice for a
// user-chosen tag. GET /api/contest?questionSlug=...&tag=...&difficulty=...
export async function GET(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const questionSlug = searchParams.get("questionSlug");
  const tag = searchParams.get("tag");
  const difficulty = searchParams.get("difficulty") ?? "Medium";
  if (!questionSlug || !tag) {
    return NextResponse.json(
      { error: "questionSlug and tag required" },
      { status: 400 }
    );
  }
  return withUser(userId, async () =>
    NextResponse.json(await topicLookup(questionSlug, tag, difficulty))
  );
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as { slug?: string };
  const slug = normalizeSlug(body.slug ?? "");
  if (!slug) {
    return NextResponse.json({ error: "Contest slug required" }, { status: 400 });
  }
  return withUser(userId, async () => {
    try {
      const plan = await buildRecoveryPlan(slug);
      return NextResponse.json(plan);
    } catch (e) {
      return NextResponse.json({ error: (e as Error).message }, { status: 502 });
    }
  });
}

export async function PATCH(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json().catch(() => ({}))) as {
    slug?: string;
    questionSlug?: string;
    attempted?: boolean;
    conquered?: boolean;
  };
  const slug = normalizeSlug(body.slug ?? "");
  if (!slug || !body.questionSlug) {
    return NextResponse.json(
      { error: "slug and questionSlug required" },
      { status: 400 }
    );
  }
  return withUser(userId, async () => {
    if (typeof body.attempted === "boolean") {
      await setAttempted(slug, body.questionSlug!, body.attempted);
    }
    if (typeof body.conquered === "boolean") {
      await setConquered(slug, body.questionSlug!, body.conquered);
    }
    return NextResponse.json({ ok: true });
  });
}
