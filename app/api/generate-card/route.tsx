import { NextRequest, NextResponse } from "next/server";
import { ImageResponse } from "next/og";
import { getCastByHash } from "@/lib/neynar";
import { buildCardElement, CARD_WIDTH, CARD_HEIGHT } from "@/lib/card-element";
import type { CastRecord, CardStyle } from "@/lib/types";

export const runtime = "nodejs";

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
