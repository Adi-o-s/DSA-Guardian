-- Social layer: one-way "follow" edges powering the Friends leaderboard.
-- (user_id follows friend_id). Opt-in to being shown on the GLOBAL board is a
-- per-user settings key `leaderboardPublic` ('1'|'0'), so no column is needed here.

CREATE TABLE IF NOT EXISTS friends (
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  friend_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, friend_id),
  CHECK (user_id <> friend_id)
);

CREATE INDEX IF NOT EXISTS idx_friends_user ON friends (user_id);
