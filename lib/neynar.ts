import type { CastRecord } from "./types";

const NEYNAR_API_BASE = "https://api.neynar.com/v2/farcaster";

function getApiKey(): string {
  const key = process.env.NEYNAR_API_KEY;
  if (!key) throw new Error("NEYNAR_API_KEY is not set");
  return key;
}

function headers() {
  return {
    accept: "application/json",
    "x-api-key": getApiKey(),
  };
}

export async function getCastByUrl(url: string): Promise<CastRecord> {
  const res = await fetch(
    `${NEYNAR_API_BASE}/cast?identifier=${encodeURIComponent(url)}&type=url`,
    { headers: headers() }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Neynar getCastByUrl failed: ${res.status} ${text}`);
  }
  const data = await res.json();
  return mapCast(data.cast);
}

export async function getCastByHash(hash: string): Promise<CastRecord> {
  const res = await fetch(
    `${NEYNAR_API_BASE}/cast?identifier=${encodeURIComponent(hash)}&type=hash`,
    { headers: headers() }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Neynar getCastByHash failed: ${res.status} ${text}`);
  }
  const data = await res.json();
  return mapCast(data.cast);
}

export async function getUserFidsByAddress(address: string): Promise<number[]> {
  const res = await fetch(
    `${NEYNAR_API_BASE}/user/bulk-by-address?addresses=${address.toLowerCase()}`,
    { headers: headers() }
  );
  if (!res.ok) {
    return [];
  }
  const data = await res.json();
  const users = data[address.toLowerCase()];
  if (!Array.isArray(users)) return [];
  return users.map((u: { fid: number }) => u.fid);
}

export async function verifyCastAuthor(
  castHash: string,
  walletAddress: string
): Promise<{ verified: boolean; castAuthorFid: number; walletFids: number[] }> {
  const cast = await getCastByHash(castHash);
  const walletFids = await getUserFidsByAddress(walletAddress);
  return {
    verified: walletFids.includes(cast.authorFid),
    castAuthorFid: cast.authorFid,
    walletFids,
  };
}

function mapCast(raw: Record<string, unknown>): CastRecord {
  const author = raw.author as Record<string, unknown>;
  const embeds = (raw.embeds as Array<Record<string, unknown>>) || [];
  const imageEmbed = embeds.find(
    (e) => typeof e.url === "string" && /\.(png|jpg|jpeg|gif|webp)/i.test(e.url as string)
  );

  return {
    hash: raw.hash as string,
    url: `https://warpcast.com/${author.username}/${(raw.hash as string).slice(0, 10)}`,
    text: raw.text as string,
    authorFid: author.fid as number,
    authorUsername: author.username as string,
    authorPfpUrl: (author.pfp_url as string) || undefined,
    publishedAt: raw.timestamp as string,
    embedImageUrl: imageEmbed ? (imageEmbed.url as string) : undefined,
  };
}
