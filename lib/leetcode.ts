// Server-only LeetCode GraphQL client (the browser cannot call this directly: CORS).
import "server-only";

const ENDPOINT = "https://leetcode.com/graphql";

// Headers LeetCode expects on both the GraphQL and contest-REST endpoints.
const BASE_HEADERS: Record<string, string> = {
  Referer: "https://leetcode.com/problemset/all/",
  "User-Agent": "Mozilla/5.0 dsa-guardian",
};

type Counts = { All: number; Easy: number; Medium: number; Hard: number };
export type PublicResult = {
  username: string;
  counts: Counts;
  recent: { slug: string; title: string; ts: number }[];
};
export type SolvedItem = { slug: string; title: string; difficulty: string };

async function gql<T>(
  query: string,
  variables: Record<string, unknown>,
  cookie?: string
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...BASE_HEADERS,
  };
  if (cookie) {
    headers["Cookie"] = cookie;
    const csrf = cookie.match(/csrftoken=([^;]+)/)?.[1];
    if (csrf) headers["x-csrftoken"] = csrf;
  }
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`LeetCode HTTP ${res.status}`);
  const json = (await res.json()) as { data?: T; errors?: { message: string }[] };
  if (json.errors?.length) throw new Error(json.errors[0].message);
  if (!json.data) throw new Error("LeetCode returned no data");
  return json.data;
}

/** Normalize whatever the user pasted into a Cookie header value. */
export function normalizeCookie(raw: string): string {
  const v = raw.trim();
  if (!v) return "";
  if (v.includes("=")) return v; // already cookie-formatted (may include csrftoken)
  return `LEETCODE_SESSION=${v}`;
}

const PUBLIC_QUERY = `query userPublic($username: String!) {
  matchedUser(username: $username) {
    username
    submitStatsGlobal { acSubmissionNum { difficulty count } }
  }
  recentAcSubmissionList(username: $username, limit: 20) {
    title titleSlug timestamp
  }
}`;

export async function fetchPublic(username: string): Promise<PublicResult> {
  type Resp = {
    matchedUser: {
      username: string;
      submitStatsGlobal: {
        acSubmissionNum: { difficulty: string; count: number }[];
      };
    } | null;
    recentAcSubmissionList: {
      title: string;
      titleSlug: string;
      timestamp: string;
    }[];
  };
  const data = await gql<Resp>(PUBLIC_QUERY, { username });
  if (!data.matchedUser) throw new Error(`User "${username}" not found`);
  const counts: Counts = { All: 0, Easy: 0, Medium: 0, Hard: 0 };
  for (const a of data.matchedUser.submitStatsGlobal.acSubmissionNum) {
    counts[a.difficulty as keyof Counts] = a.count;
  }
  return {
    username: data.matchedUser.username,
    counts,
    recent: (data.recentAcSubmissionList ?? []).map((s) => ({
      slug: s.titleSlug,
      title: s.title,
      ts: Number(s.timestamp) * 1000,
    })),
  };
}

const SOLVED_QUERY = `query solved($skip: Int!, $limit: Int!) {
  problemsetQuestionList: questionList(categorySlug: "", limit: $limit, skip: $skip, filters: { status: AC }) {
    total: totalNum
    questions: data { titleSlug title difficulty status }
  }
}`;

/** Full solved list for the authenticated user (requires a valid cookie). */
export async function fetchSolvedAuthenticated(
  cookie: string
): Promise<SolvedItem[]> {
  type Resp = {
    problemsetQuestionList: {
      total: number;
      questions: {
        titleSlug: string;
        title: string;
        difficulty: string;
        status: string | null;
      }[];
    };
  };
  const limit = 100;
  let skip = 0;
  let total = Infinity;
  const out: SolvedItem[] = [];
  while (skip < total) {
    const data = await gql<Resp>(SOLVED_QUERY, { skip, limit }, cookie);
    const page = data.problemsetQuestionList;
    total = page.total;
    if (total === 0) break;
    for (const q of page.questions) {
      // status === 'ac' confirms the cookie is authenticated and the problem is solved
      if (q.status === "ac" || q.status === "AC") {
        out.push({ slug: q.titleSlug, title: q.title, difficulty: q.difficulty });
      }
    }
    skip += limit;
    if (page.questions.length === 0) break;
  }
  if (out.length === 0) {
    throw new Error(
      "No solved problems returned — the cookie may be invalid or expired."
    );
  }
  return out;
}

export type ContestQuestion = { slug: string; title: string; credit: number };
export type ContestInfo = {
  title: string;
  startTime: number; // epoch seconds
  duration: number; // seconds
  questions: ContestQuestion[];
};

const CONTEST_QUERY = `query contestInfo($slug: String!) {
  contest(titleSlug: $slug) { title startTime duration }
  contestQuestionList(contestSlug: $slug) { title titleSlug credit }
}`;

/**
 * Public contest metadata + its question list, via GraphQL. No auth needed.
 * `slug` is e.g. "weekly-contest-380" (from the contest URL).
 * (The REST /contest/api/info endpoint is Cloudflare-blocked for non-browsers,
 * so we use GraphQL, which the rest of the app already relies on.)
 */
export async function fetchContestInfo(slug: string): Promise<ContestInfo> {
  type Resp = {
    contest: { title: string; startTime: number; duration: number } | null;
    contestQuestionList:
      | { title: string; titleSlug: string; credit: number }[]
      | null;
  };
  const data = await gql<Resp>(CONTEST_QUERY, { slug });
  if (!data.contest) throw new Error(`Contest "${slug}" not found`);
  const questions = (data.contestQuestionList ?? [])
    .filter((q) => q.titleSlug)
    .map((q) => ({
      slug: q.titleSlug,
      title: q.title ?? q.titleSlug,
      credit: q.credit ?? 0,
    }));
  if (questions.length === 0) {
    throw new Error(`No questions found for contest "${slug}"`);
  }
  return {
    title: data.contest.title,
    startTime: data.contest.startTime ?? 0,
    duration: data.contest.duration ?? 0,
    questions,
  };
}

const QUESTION_TAGS_QUERY = `query questionTags($titleSlug: String!) {
  question(titleSlug: $titleSlug) {
    difficulty
    topicTags { slug }
  }
}`;

/**
 * Live tags + difficulty for a single problem. Used as a fallback when a
 * brand-new contest problem isn't in the bundled meta yet. Tags may still be
 * empty for very new problems (LeetCode hides them until publication).
 */
export async function fetchQuestionTags(
  slug: string
): Promise<{ tags: string[]; difficulty: string | null }> {
  type Resp = {
    question: {
      difficulty: string | null;
      topicTags: { slug: string }[];
    } | null;
  };
  const data = await gql<Resp>(QUESTION_TAGS_QUERY, { titleSlug: slug });
  if (!data.question) return { tags: [], difficulty: null };
  return {
    tags: (data.question.topicTags ?? []).map((t) => t.slug),
    difficulty: data.question.difficulty ?? null,
  };
}
