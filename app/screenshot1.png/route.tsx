import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f0f23",
          color: "white",
          gap: 40,
        }}
      >
        <div style={{ fontSize: 120, fontWeight: 900, color: "#7c6fff" }}>
          Cast-to-NFT
        </div>
        <div style={{ fontSize: 48, opacity: 0.6 }}>
          Enter a Cast URL to get started
        </div>
        <div
          style={{
            width: 800,
            height: 80,
            borderRadius: 16,
            background: "rgba(255,255,255,0.1)",
            border: "2px solid rgba(255,255,255,0.2)",
            display: "flex",
            alignItems: "center",
            padding: "0 32px",
            fontSize: 28,
            color: "#888",
          }}
        >
          https://warpcast.com/...
        </div>
      </div>
    ),
    { width: 1284, height: 2778 }
  );
}
