import satori from "satori";
import sharp from "sharp";
import React from "react";
import type { CastRecord, CardStyle } from "@/lib/types";

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

export async function generateCardPng(
  cast: CastRecord,
  style: CardStyle = "midnight",
  includeImage = false
): Promise<Buffer> {
  const theme = STYLE_THEMES[style] || STYLE_THEMES.midnight;
  const displayText =
    cast.text.length > 280 ? cast.text.slice(0, 277) + "..." : cast.text;
  const dateStr = new Date(cast.publishedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const element = (
    <div
      style={{
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        display: "flex",
        flexDirection: "column",
        padding: 48,
        backgroundColor: theme.bg,
        borderRadius: 24,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
        {cast.authorPfpUrl ? (
          <img
            src={cast.authorPfpUrl}
            width={64}
            height={64}
            style={{ borderRadius: "50%", marginRight: 16 }}
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
        <img
          src={cast.embedImageUrl}
          style={{
            width: "100%",
            maxHeight: 200,
            objectFit: "cover" as const,
            borderRadius: 12,
            marginTop: 16,
          }}
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

  const svg = await satori(element, {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    fonts: [],
  });

  return sharp(Buffer.from(svg)).png().toBuffer();
}
