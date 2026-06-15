// Maps LeetCode topic-tag slugs to a small set of curated tutorial videos.
// Data lives in data/topic-videos.json (keyed by the same tag vocabulary as
// lib/topics.ts STEP_TAGS, plus a "_default" bucket for the no-tags case).
import fs from "node:fs";
import path from "node:path";

export type Video = { title: string; channel: string; url: string };

let _videos: Record<string, Video[]> | null = null;

function getVideoMap(): Record<string, Video[]> {
  return (_videos ??= JSON.parse(
    fs.readFileSync(
      path.join(process.cwd(), "data", "topic-videos.json"),
      "utf8"
    )
  ) as Record<string, Video[]>);
}

/**
 * Up to `limit` curated videos for the given tags (deduped by url, in tag
 * order so the most specific concept leads). Falls back to the "_default"
 * "how to upsolve" videos when no tag matches.
 */
export function videosForTags(tags: string[], limit = 3): Video[] {
  const map = getVideoMap();
  const seen = new Set<string>();
  const out: Video[] = [];
  for (const tag of tags) {
    for (const v of map[tag] ?? []) {
      if (seen.has(v.url)) continue;
      seen.add(v.url);
      out.push(v);
      if (out.length >= limit) return out;
    }
  }
  if (out.length === 0) return (map["_default"] ?? []).slice(0, limit);
  return out;
}
