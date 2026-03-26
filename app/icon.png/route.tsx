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
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #7c6fff 0%, #0f0f23 100%)",
          borderRadius: "200px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 40,
          }}
        >
          <div
            style={{
              fontSize: 320,
              fontWeight: 900,
              color: "white",
              lineHeight: 1,
            }}
          >
            C
          </div>
          <div
            style={{
              fontSize: 120,
              fontWeight: 700,
              color: "#e0e0ff",
              lineHeight: 1,
            }}
          >
            NFT
          </div>
        </div>
      </div>
    ),
    { width: 1024, height: 1024 }
  );
}
