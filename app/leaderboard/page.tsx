"use client";

import { useState } from "react";
import useSWR from "swr";
import { Flame, Trophy, UserPlus, X, Lock, Users, Globe } from "lucide-react";
import { fetcher, post, del } from "@/lib/client";

type LeaderRow = {
  userId: string;
  username: string | null;
  image: string | null;
  streak: number | null;
  weekly: number | null;
  isMe: boolean;
  isPrivate: boolean;
};
type BoardResp = { scope: string; rows: LeaderRow[] };
type FriendsResp = { friends: { userId: string; username: string | null; image: string | null }[] };
type SettingsResp = { settings: { leaderboardPublic: string } };

export default function LeaderboardPage() {
  const [scope, setScope] = useState<"global" | "friends">("global");
  const { data: board, mutate: mutateBoard } = useSWR<BoardResp>(
    `/api/leaderboard?scope=${scope}`,
    fetcher
  );
  const { data: friends, mutate: mutateFriends } = useSWR<FriendsResp>("/api/friends", fetcher);
  const { data: settings, mutate: mutateSettings } = useSWR<SettingsResp>(
    "/api/settings",
    fetcher
  );

  const [handle, setHandle] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const optedIn = settings?.settings.leaderboardPublic === "1";

  const refresh = () => {
    mutateBoard();
    mutateFriends();
  };

  const addFriend = async () => {
    setMsg(null);
    try {
      await post("/api/friends", { username: handle });
      setHandle("");
      refresh();
    } catch (e) {
      setMsg((e as Error).message);
    }
  };

  const removeFriend = async (friendId: string) => {
    await del("/api/friends", { friendId });
    refresh();
  };

  const toggleOptIn = async () => {
    await post("/api/settings", { leaderboardPublic: optedIn ? "0" : "1" });
    mutateSettings();
    mutateBoard();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <Trophy className="h-5 w-5 text-medium" />
          Leaderboard
        </h1>
        <label className="flex items-center gap-2 text-sm text-muted cursor-pointer">
          <input type="checkbox" checked={optedIn} onChange={toggleOptIn} />
          Show me on the global board
        </label>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-border bg-panel p-1 w-fit">
        <Tab active={scope === "global"} onClick={() => setScope("global")} icon={<Globe className="h-4 w-4" />}>
          Global
        </Tab>
        <Tab active={scope === "friends"} onClick={() => setScope("friends")} icon={<Users className="h-4 w-4" />}>
          Friends
        </Tab>
      </div>

      {/* Add friend */}
      <div className="space-y-1.5">
        <div className="flex gap-2">
          <input
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addFriend()}
            placeholder="Add a friend by GitHub username"
            className="input flex-1"
          />
          <button
            onClick={addFriend}
            className="flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90 whitespace-nowrap"
          >
            <UserPlus className="h-4 w-4" />
            Add
          </button>
        </div>
        {msg && <p className="text-xs text-hard">{msg}</p>}
        {friends && friends.friends.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {friends.friends.map((f) => (
              <span
                key={f.userId}
                className="flex items-center gap-1.5 rounded-full border border-border bg-panel2 pl-2 pr-1 py-1 text-xs"
              >
                {f.username}
                <button
                  onClick={() => removeFriend(f.userId)}
                  className="rounded-full p-0.5 hover:bg-border"
                  title="Unfollow"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Board */}
      {!board ? (
        <div className="text-muted">Loading…</div>
      ) : board.rows.length === 0 ? (
        <p className="text-sm text-muted">
          {scope === "global"
            ? "No one has opted into the global board yet. Toggle the switch above to be first."
            : "You're not following anyone yet. Add a friend by their GitHub username above."}
        </p>
      ) : (
        <div className="rounded-xl border border-border bg-panel divide-y divide-border">
          {board.rows.map((r, i) => (
            <Row key={r.userId} rank={i + 1} row={r} />
          ))}
        </div>
      )}
    </div>
  );
}

function Tab({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors ${
        active ? "bg-panel2 text-text" : "text-muted hover:text-text"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function Row({ rank, row }: { rank: number; row: LeaderRow }) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 ${row.isMe ? "bg-accent/5" : ""}`}
    >
      <span className="w-6 text-center text-sm text-muted tabular-nums">{rank}</span>
      {row.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={row.image} alt="" className="h-8 w-8 rounded-full border border-border" />
      ) : (
        <div className="h-8 w-8 rounded-full bg-panel2 border border-border" />
      )}
      <span className="flex-1 text-sm">
        {row.username ?? "unknown"}
        {row.isMe && <span className="ml-2 text-xs text-accent">you</span>}
      </span>
      {row.isPrivate ? (
        <span className="flex items-center gap-1 text-xs text-muted">
          <Lock className="h-3.5 w-3.5" />
          private
        </span>
      ) : (
        <>
          <span className="flex items-center gap-1 text-sm text-medium tabular-nums" title="Current streak">
            <Flame className="h-4 w-4" />
            {row.streak}
          </span>
          <span className="w-20 text-right text-sm text-muted tabular-nums" title="Solved this week">
            {row.weekly} / wk
          </span>
        </>
      )}
    </div>
  );
}
