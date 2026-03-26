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
          gap: 60,
        }}
      >
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: "50%",
            background: "#22c55e",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 64,
          }}
        >
          ✓
        </div>
        <div style={{ fontSize: 80, fontWeight: 900 }}>Mint Complete!</div>
        <div style={{ fontSize: 36, opacity: 0.6, marginTop: 20 }}>
          Your Cast is now an NFT on Base
        </div>
        <div
          style={{
            marginTop: 40,
            padding: "24px 48px",
            borderRadius: 16,
            background: "#7c6fff",
            fontSize: 32,
            fontWeight: 700,
          }}
        >
          View on Basescan
        </div>
      </div>
    ),
    { width: 1284, height: 2778 }
  );
}
