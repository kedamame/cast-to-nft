import { NextRequest, NextResponse } from "next/server";
import { ImageResponse } from "next/og";
import { uploadBuffer, uploadJson } from "@/lib/pinata";
import { getCastByHash } from "@/lib/neynar";
import { buildCardElement, CARD_WIDTH, CARD_HEIGHT } from "@/lib/card-element";
import { uploadSchema } from "@/lib/validations";
import type { CardStyle } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = uploadSchema.parse(body);

    // Get cast details
    const cast = await getCastByHash(parsed.castHash);

    // Generate card image via ImageResponse → Buffer
    const element = buildCardElement(
      cast,
      parsed.style as CardStyle,
      parsed.includeImage
    );
    const imageResponse = new ImageResponse(element, {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
    });
    const arrayBuffer = await imageResponse.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    // Upload image to IPFS
    const imageUri = await uploadBuffer(
      imageBuffer,
      `cast-${parsed.castHash.slice(0, 10)}.png`
    );

    // Build ERC-1155 metadata
    const metadata = {
      name: `Cast by @${cast.authorUsername}`,
      description: cast.text,
      image: imageUri,
      external_url: cast.url,
      attributes: [
        { trait_type: "Author", value: cast.authorUsername },
        { trait_type: "Author FID", value: cast.authorFid.toString() },
        { trait_type: "Style", value: parsed.style },
        { trait_type: "Mint Price (ETH)", value: parsed.mintPriceEth },
        {
          trait_type: "Published",
          display_type: "date",
          value: Math.floor(new Date(cast.publishedAt).getTime() / 1000),
        },
      ],
    };

    // Upload metadata to IPFS
    const metadataUri = await uploadJson(
      metadata as Record<string, unknown>,
      `cast-meta-${parsed.castHash.slice(0, 10)}.json`
    );

    return NextResponse.json({ imageUri, metadataUri });
  } catch (err) {
    console.error("IPFS upload error:", err);
    return NextResponse.json(
      { error: "IPFS への保存に失敗しました。" },
      { status: 500 }
    );
  }
}
