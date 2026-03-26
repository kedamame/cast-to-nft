import { NextRequest, NextResponse } from "next/server";
import { getCastByHash } from "@/lib/neynar";
import { generateCardPng } from "@/lib/card-generator";
import type { CardStyle } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { castHash, style = "midnight", includeImage = false } = body;

    if (!castHash) {
      return NextResponse.json(
        { error: "castHash is required" },
        { status: 400 }
      );
    }

    const cast = await getCastByHash(castHash);
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
    console.error("画像生成エラー:", err);
    return NextResponse.json(
      { error: "画像生成に失敗しました。もう一度お試しください。" },
      { status: 500 }
    );
  }
}
