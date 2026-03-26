import { NextRequest, NextResponse } from "next/server";
import { getCastByUrl, getCastByHash } from "@/lib/neynar";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  const hash = req.nextUrl.searchParams.get("hash");

  if (!url && !hash) {
    return NextResponse.json(
      { error: "url または hash パラメータが必要です" },
      { status: 400 }
    );
  }

  try {
    const cast = hash ? await getCastByHash(hash) : await getCastByUrl(url!);
    return NextResponse.json({ cast });
  } catch (err) {
    console.error("Cast取得エラー:", err);
    return NextResponse.json(
      { error: "Cast が見つかりませんでした。URL を確認してください。" },
      { status: 404 }
    );
  }
}
