import type { MetadataRoute } from "next";

// Next does NOT apply basePath to values *inside* the manifest body (only to the
// <link rel="manifest"> href), so every path here is prefixed explicitly.
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/**
 * Installable on a phone — this is a daily-habit product, so a home-screen
 * icon matters.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DSA Guardian",
    short_name: "Guardian",
    description:
      "Striver A2Z + LeetCode daily practice guardian — streaks, Hard recommendations and contest upsolving.",
    start_url: `${BASE_PATH}/`,
    scope: `${BASE_PATH}/`,
    display: "standalone",
    background_color: "#0a0a0b",
    theme_color: "#0a0a0b",
    icons: [
      { src: `${BASE_PATH}/icon.svg`, sizes: "any", type: "image/svg+xml" },
      { src: `${BASE_PATH}/apple-icon`, sizes: "180x180", type: "image/png" },
    ],
  };
}
