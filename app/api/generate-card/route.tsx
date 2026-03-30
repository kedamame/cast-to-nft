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

    // Force full evaluation inside try/catch so satori errors are caught
    const imageResponse = new ImageResponse(element, {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
    });
    const arrayBuffer = await imageResponse.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      headers: { "Content-Type": "image/png" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Card generation error:", message);
    return NextResponse.json(
      { error: `Card generation failed: ${message}` },
      { status: 500 }
    );
  }
}
