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
            fontSize: 64,
            fontWeight: 900,
            color: "#7c6fff",
            marginBottom: 16,
          }}
        >
          Cast-to-NFT
        </div>
        <div style={{ fontSize: 24, opacity: 0.7, marginTop: 8 }}>
          Mint your Casts on Base
        </div>
      </div>
    ),
    { width: 900, height: 600 }
  );
}
