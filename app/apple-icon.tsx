import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0A0A0B",
        }}
      >
        <svg width="112" height="112" viewBox="0 0 32 32" fill="none">
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
      </div>
    ),
    size
  );
}
