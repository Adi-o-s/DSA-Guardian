// Aggregated dashboard state — one object the client can poll on a refresh interval.
import { getSetting } from "./db";
import { lcDate, lcDayStart } from "./day";
import { ensureDaily, pickDaily, type Recommendation } from "./recommend";
import {
  completedStepIds,
  getSolvedSet,
  lastSolvedStep,
  nextUnsolvedInStep,
  solvedSince,
  solvedSinceByDifficulty,
} from "./sync";
import { getMeta, stepTitle } from "./data";
import { roadmapTopic } from "./roadmap";
import { computeStreak, markDayProgress } from "./streak";

export type ContinueItem = {
  slug: string;
  title: string;
  url: string;
  difficulty: string | null;
};

export type DashboardState = {
  username: string;
  configured: boolean;
  lcDate: string;
  // questions goal (any difficulty) — asked daily
  goal: number;
  solvedToday: number;
  goalMet: boolean;
  // hard goal — configured in settings
  hardGoal: number;
  hardSolvedToday: number;
  hardGoalMet: boolean;
  // streak of consecutive days the questions goal was met
  streak: number;
  totalSolved: number;
  completedTopics: { id: number; title: string }[];
  recommendations: Recommendation[];
  continueTopic: { id: number; title: string; roadmap: string | null } | null;
  continueProblems: ContinueItem[];
};

export async function buildState(): Promise<DashboardState> {
  const username = (await getSetting("username")).trim();
  const date = await lcDate();
  const daily = await ensureDaily(date);
  const dayStart = await lcDayStart();

  const solvedToday = await solvedSince(dayStart);
  const hardGoal = parseInt((await getSetting("hardGoal")) || "2", 10) || 2;
  const hardSolvedToday = await solvedSinceByDifficulty(dayStart, "Hard");

  // Latch streak progress for today against the questions goal.
  await markDayProgress(date, solvedToday, daily.goal);

  const completed = [...(await completedStepIds())].map((id) => ({
    id,
    title: stepTitle(id),
  }));

  // "Continue where you left off": next 5 unsolved in the last-solved topic,
  // falling back to the first completed topic, else step 3 (Arrays).
  const lastStep = (await lastSolvedStep()) ?? completed[0]?.id ?? 3;
  const continueProblemsRaw = await nextUnsolvedInStep(lastStep, 5);
  const meta = getMeta();
  const continueProblems: ContinueItem[] = continueProblemsRaw.map((p) => ({
    slug: p.slug,
    title: p.title,
    url: `https://leetcode.com/problems/${p.slug}/`,
    difficulty: meta[p.slug]?.difficulty ?? null,
  }));

  const [streak, solvedSet, recommendations] = await Promise.all([
    computeStreak(),
    getSolvedSet(),
    pickDaily(date),
  ]);

  return {
    username,
    configured: Boolean(username),
    lcDate: date,
    goal: daily.goal,
    solvedToday,
    goalMet: solvedToday >= daily.goal,
    hardGoal,
    hardSolvedToday,
    hardGoalMet: hardSolvedToday >= hardGoal,
    streak,
    totalSolved: solvedSet.size,
    completedTopics: completed,
    recommendations,
    continueTopic: continueProblems.length
      ? {
          id: lastStep,
          title: stepTitle(lastStep),
          roadmap: roadmapTopic(lastStep),
        }
      : null,
    continueProblems,
  };
}
