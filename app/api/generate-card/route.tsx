import { NextRequest, NextResponse } from "next/server";
import { getCastByHash } from "@/lib/neynar";
import { generateCardPng } from "@/lib/card-generator";
import type { CastRecord, CardStyle } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      castHash,
      style = "midnight",
      includeImage = false,
      cast: castData,
    } = body;

    // Use provided cast data, or fetch by hash as fallback
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

    const png = await generateCardPng(
      cast,
      style as CardStyle,
      includeImage
    );

    return new NextResponse(new Uint8Array(png) as unknown as BodyInit, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err) {
    console.error("Card generation error:", err);
    return NextResponse.json(
      { error: "Failed to generate card image." },
      { status: 500 }
    );
  }
}
