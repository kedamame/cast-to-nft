import { NextRequest, NextResponse } from "next/server";
import { ImageResponse } from "next/og";
import { getCastByHash } from "@/lib/neynar";
import type { CastRecord, CardStyle } from "@/lib/types";

export const runtime = "nodejs";

const CARD_WIDTH = 1200;
const CARD_HEIGHT = 630;

const STYLE_THEMES: Record<
  CardStyle,
  { bg: string; text: string; accent: string; secondary: string }
> = {
  midnight: {
    bg: "#0f0f23",
    text: "#e0e0ff",
    accent: "#7c6fff",
    secondary: "#4a4a7a",
  },
  paper: {
    bg: "#faf8f5",
    text: "#2c2c2c",
    accent: "#8b7355",
    secondary: "#a09080",
  },
  neon: {
    bg: "#0a0a0a",
    text: "#00ff88",
    accent: "#ff00ff",
    secondary: "#00ccff",
  },
  minimal: {
    bg: "#ffffff",
    text: "#111111",
    accent: "#0066ff",
    secondary: "#888888",
  },
};

function buildCardElement(
  cast: CastRecord,
  style: CardStyle,
  includeImage: boolean
) {
  const theme = STYLE_THEMES[style] || STYLE_THEMES.midnight;
  const displayText =
    cast.text.length > 280 ? cast.text.slice(0, 277) + "..." : cast.text;
  const dateStr = new Date(cast.publishedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div
      style={{
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        display: "flex",
        flexDirection: "column",
        padding: 48,
        backgroundColor: theme.bg,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
        {cast.authorPfpUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cast.authorPfpUrl}
            width={64}
            height={64}
            style={{ borderRadius: "50%", marginRight: 16 }}
            alt=""
          />
        ) : (
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: "50%",
              backgroundColor: theme.accent,
              marginRight: 16,
            }}
          />
        )}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: theme.text }}>
            @{cast.authorUsername}
          </div>
          <div style={{ fontSize: 18, color: theme.secondary }}>{dateStr}</div>
        </div>
      </div>

      <div
        style={{
          fontSize: 32,
          lineHeight: 1.5,
          color: theme.text,
          flex: 1,
          overflow: "hidden",
        }}
      >
        {displayText}
      </div>

      {includeImage && cast.embedImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={cast.embedImageUrl}
          style={{
            width: "100%",
            maxHeight: 200,
            objectFit: "cover",
            borderRadius: 12,
            marginTop: 16,
          }}
          alt=""
        />
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "auto",
          paddingTop: 16,
          borderTop: `1px solid ${theme.secondary}40`,
          fontSize: 16,
          color: theme.secondary,
        }}
      >
        <span>Cast-to-NFT</span>
        <span>on Base</span>
      </div>
    </div>
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      castHash,
      style = "midnight",
      includeImage = false,
      cast: castData,
    } = body;

    let cast: CastRecord;
    if (castData && castData.hash && castData.text !== undefined) {
      cast = castData as CastRecord;
    } else if (castHash) {
      cast = await getCastByHash(castHash);
    } else {
      return NextResponse.json(
        { error: "castHash or cast data is required" },
        { status: 400 }
      );
    }

    const element = buildCardElement(cast, style as CardStyle, includeImage);

    return new ImageResponse(element, {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
    });
  } catch (err) {
    console.error("Card generation error:", err);
    return NextResponse.json(
      { error: "Failed to generate card image." },
      { status: 500 }
    );
  }
}
