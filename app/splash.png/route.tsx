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
          background: "#0f0f23",
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 900,
            color: "#7c6fff",
            lineHeight: 1,
          }}
        >
          C
        </div>
      </div>
    ),
    { width: 200, height: 200 }
  );
}
