import { NextRequest, NextResponse } from "next/server";
import { getCastByUrl, getCastByHash } from "@/lib/neynar";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  const hash = req.nextUrl.searchParams.get("hash");
  const fidStr = req.nextUrl.searchParams.get("fid");
  const fid = fidStr ? Number(fidStr) : undefined;

  if (!url && !hash) {
    return NextResponse.json(
      { error: "url or hash parameter is required" },
      { status: 400 }
    );
  }

  try {
    const cast = hash
      ? await getCastByHash(hash, fid)
      : await getCastByUrl(url!);
    return NextResponse.json({ cast });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Cast fetch error:", message);
    return NextResponse.json(
      {
        error: "Cast not found. Please check the URL.",
        debug: message,
        params: { url, hash, fid },
      },
      { status: 404 }
    );
  }
}
