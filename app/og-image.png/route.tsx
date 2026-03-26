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
          background: "linear-gradient(135deg, #0f0f23 0%, #1a1a3e 100%)",
          color: "white",
        }}
      >
        <div
          style={{
            fontSize: 80,
            fontWeight: 900,
            color: "#7c6fff",
            marginBottom: 20,
          }}
        >
          Cast-to-NFT
        </div>
        <div style={{ fontSize: 32, opacity: 0.8 }}>
          Turn your Farcaster Casts into NFTs on Base
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
