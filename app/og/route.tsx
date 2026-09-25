import { ImageResponse } from "next/og";

const size = { width: 1200, height: 630 };

// Served as a normal route rather than Next's `opengraph-image` convention:
// that convention emits an og:image URL with no basePath prefix, which 404s
// behind /dsaguardian. Referenced explicitly from metadata in app/layout.tsx.
export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0A0A0B",
          padding: 72,
          color: "#E8E9EC",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <svg width="52" height="52" viewBox="0 0 32 32" fill="none">
            <path
              d="M16 5.5 24.5 9v6.2c0 5.2-3.4 9.4-8.5 11.3-5.1-1.9-8.5-6.1-8.5-11.3V9L16 5.5Z"
              stroke="#6E8BFF"
              strokeWidth="2.1"
              strokeLinejoin="round"
            />
            <path
              d="m12.3 15.8 2.9 2.9 5-5.4"
              stroke="#6E8BFF"
              strokeWidth="2.1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span style={{ fontSize: 34, fontWeight: 600 }}>DSA Guardian</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <span style={{ fontSize: 74, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2 }}>
            Your daily guardian
          </span>
          <span
            style={{
              fontSize: 74,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: -2,
              color: "#6E8BFF",
            }}
          >
            for DSA mastery.
          </span>
          <span style={{ fontSize: 30, color: "#9BA1AD", marginTop: 12 }}>
            Striver A2Z · live LeetCode sync · streaks · contest upsolving
          </span>
        </div>

        <div style={{ display: "flex", gap: 14 }}>
          {[
            ["Easy", "#22C55E"],
            ["Medium", "#F59E0B"],
            ["Hard", "#EF4444"],
          ].map(([label, color]) => (
            <span
              key={label}
              style={{
                fontSize: 24,
                color,
                border: `2px solid ${color}55`,
                borderRadius: 999,
                padding: "8px 22px",
              }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>
    ),
    size
  );
}
