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
        <div style={{ fontSize: 80, fontWeight: 900, color: "#7c6fff" }}>
          Choose Your Style
        </div>
        <div
          style={{
            display: "flex",
            gap: 32,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {["Midnight", "Paper", "Neon", "Minimal"].map((style) => (
            <div
              key={style}
              style={{
                width: 280,
                height: 160,
                borderRadius: 16,
                background:
                  style === "Midnight"
                    ? "#0f0f23"
                    : style === "Paper"
                      ? "#faf8f5"
                      : style === "Neon"
                        ? "#0a0a0a"
                        : "#ffffff",
                border: `3px solid ${style === "Midnight" ? "#7c6fff" : style === "Paper" ? "#8b7355" : style === "Neon" ? "#00ff88" : "#0066ff"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 32,
                color:
                  style === "Paper" || style === "Minimal"
                    ? "#333"
                    : "#fff",
              }}
            >
              {style}
            </div>
          ))}
        </div>
      </div>
    ),
    { width: 1284, height: 2778 }
  );
}
