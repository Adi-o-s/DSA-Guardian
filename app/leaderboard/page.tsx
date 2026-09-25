"use client";

import { useState } from "react";
import useSWR from "swr";
import { Flame, UserPlus, X, Users, Globe, Trophy } from "lucide-react";
import { fetcher, post, del } from "@/lib/client";
import { cn } from "@/lib/cn";
import {
  Badge,
  Button,
  Card,
  CardList,
  EmptyState,
  PageHeader,
  Segmented,
  Skeleton,
  useToast,
} from "@/components/ui";

type LeaderRow = {
  userId: string;
  username: string | null;
  image: string | null;
  streak: number;
  weekly: number;
  isMe: boolean;
};
type BoardResp = { scope: string; rows: LeaderRow[] };
type FriendsResp = {
  friends: { userId: string; username: string | null; image: string | null }[];
};

const MEDAL = ["text-flame", "text-fg-muted", "text-diff-medium"];

export default function LeaderboardPage() {
  const [scope, setScope] = useState<"global" | "friends">("global");
  const { data: board, mutate: mutateBoard } = useSWR<BoardResp>(
    `/api/leaderboard?scope=${scope}`,
    fetcher
  );
  const { data: friends, mutate: mutateFriends } =
    useSWR<FriendsResp>("/api/friends", fetcher);
  const toast = useToast();

  const [handle, setHandle] = useState("");
  const [adding, setAdding] = useState(false);

  const refresh = () => {
    mutateBoard();
    mutateFriends();
  };

  const addFriend = async () => {
    if (!handle.trim()) {
      toast("Enter a GitHub username first.", "error");
      return;
    }
    setAdding(true);
    try {
      await post("/api/friends", { username: handle.trim() });
      toast(`Now following ${handle.trim()}.`, "success");
      setHandle("");
      refresh();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setAdding(false);
    }
  };

  const removeFriend = async (friendId: string, username: string | null) => {
    try {
      await del("/api/friends", { friendId });
      toast(`Unfollowed ${username ?? "that user"}.`);
      refresh();
    } catch (e) {
      toast((e as Error).message, "error");
    }
  };

  const rows = board?.rows ?? [];
  const podium = rows.slice(0, 3);
  const rest = rows.slice(3);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leaderboard"
        description="Ranked by current streak, then questions solved this week."
        actions={
          <Segmented
            label="Leaderboard scope"
            value={scope}
            onChange={setScope}
            options={[
              { value: "global", label: "Global", icon: <Globe className="h-4 w-4" /> },
              { value: "friends", label: "Friends", icon: <Users className="h-4 w-4" /> },
            ]}
          />
        }
      />

      <Card className="space-y-3 p-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addFriend()}
            placeholder="Add a friend by GitHub username"
            aria-label="Friend's GitHub username"
            className="input flex-1"
          />
          <Button
            variant="primary"
            onClick={addFriend}
            loading={adding}
            icon={<UserPlus className="h-4 w-4" aria-hidden="true" />}
          >
            Add
          </Button>
        </div>

        {friends && friends.friends.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {friends.friends.map((f) => (
              <li key={f.userId}>
                <span className="flex items-center gap-1 rounded-full border border-line bg-surface-overlay py-1 pl-2.5 pr-1 text-xs text-fg-muted">
                  {f.username}
                  <button
                    onClick={() => removeFriend(f.userId, f.username)}
                    aria-label={`Unfollow ${f.username ?? "user"}`}
                    className="rounded-full p-0.5 text-fg-subtle transition-colors hover:bg-line hover:text-fg"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {!board ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-card" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<Trophy className="h-5 w-5" />}
          title={scope === "global" ? "Nobody here yet" : "You're not following anyone"}
          description={
            scope === "global"
              ? "Be the first on the board — solve a question today."
              : "Add a friend by their GitHub username above to compare streaks."
          }
        />
      ) : (
        <div className="space-y-4">
          {/* Podium — the gamified moment on this page. */}
          <div className="grid gap-3 sm:grid-cols-3">
            {podium.map((r, i) => (
              <PodiumCard key={r.userId} rank={i + 1} row={r} />
            ))}
          </div>

          {rest.length > 0 && (
            <CardList>
              {rest.map((r, i) => (
                <Row key={r.userId} rank={i + 4} row={r} />
              ))}
            </CardList>
          )}
        </div>
      )}
    </div>
  );
}

function PodiumCard({ rank, row }: { rank: number; row: LeaderRow }) {
  return (
    <Card
      className={cn(
        "flex flex-col items-center gap-2 p-4 text-center",
        row.isMe && "border-brand/50 bg-brand/5"
      )}
    >
      <span className={cn("num text-2xs font-semibold", MEDAL[rank - 1])}>#{rank}</span>
      {row.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={row.image}
          alt=""
          className="h-12 w-12 rounded-full border border-line"
        />
      ) : (
        <div className="h-12 w-12 rounded-full border border-line bg-surface-overlay" />
      )}
      <div className="min-w-0">
        <p className="truncate text-md font-medium text-fg">{row.username ?? "unknown"}</p>
        {row.isMe && <Badge tone="brand" className="mt-1">You</Badge>}
      </div>
      <div className="flex items-center gap-3 text-sm">
        <span className="inline-flex items-center gap-1 text-flame" title="Current streak">
          <Flame className="h-4 w-4" aria-hidden="true" />
          <span className="num font-semibold">{row.streak}</span>
        </span>
        <span className="num text-fg-muted" title="Solved this week">
          {row.weekly}/wk
        </span>
      </div>
    </Card>
  );
}

function Row({ rank, row }: { rank: number; row: LeaderRow }) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3",
        row.isMe && "bg-brand/5"
      )}
    >
      <span className="num w-6 shrink-0 text-center text-sm text-fg-subtle">{rank}</span>
      {row.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={row.image} alt="" className="h-8 w-8 rounded-full border border-line" />
      ) : (
        <div className="h-8 w-8 rounded-full border border-line bg-surface-overlay" />
      )}
      <span className="min-w-0 flex-1 truncate text-sm text-fg">
        {row.username ?? "unknown"}
        {row.isMe && (
          <Badge tone="brand" className="ml-2">
            You
          </Badge>
        )}
      </span>
      <span
        className="inline-flex items-center gap-1 text-sm text-flame"
        title="Current streak"
      >
        <Flame className="h-4 w-4" aria-hidden="true" />
        <span className="num">{row.streak}</span>
      </span>
      <span className="num w-16 shrink-0 text-right text-sm text-fg-muted" title="Solved this week">
        {row.weekly}/wk
      </span>
    </div>
  );
}
