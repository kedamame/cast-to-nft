import { NextRequest, NextResponse } from "next/server";
import { verifyCastAuthor } from "@/lib/neynar";
import { verifyAuthorSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = verifyAuthorSchema.parse(body);

    const result = await verifyCastAuthor(
      parsed.castHash,
      parsed.walletAddress
    );

    return NextResponse.json(result);
  } catch (err) {
    console.error("著者確認エラー:", err);
    return NextResponse.json(
      { error: "著者の確認に失敗しました。", verified: false },
      { status: 500 }
    );
  }
}
