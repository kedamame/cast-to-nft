import type { CastRecord } from "./types";

// Pinata Hub API (FREE, no auth required)
const HUB_API = "https://hub.pinata.cloud/v1";

// Pinata v3 Farcaster API (requires PINATA_JWT)
const PINATA_V3_API = "https://api.pinata.cloud/v3/farcaster";

function getPinataJwt(): string {
  const jwt = process.env.PINATA_JWT;
  if (!jwt) throw new Error("PINATA_JWT is not set");
  return jwt;
}

// ---------- Hub API helpers ----------

async function getVerificationsByFid(fid: number): Promise<string[]> {
  const res = await fetch(`${HUB_API}/verificationsByFid?fid=${fid}`);
  if (!res.ok) return [];
  const data = await res.json();
  const messages = data?.messages;
  if (!Array.isArray(messages)) return [];
  return messages
    .map(
      (m: Record<string, unknown>) =>
        (m?.data as Record<string, unknown>)?.verificationAddAddressBody as
          | Record<string, unknown>
          | undefined
    )
    .filter(Boolean)
    .map((body) => (body!.address as string)?.toLowerCase())
    .filter(Boolean);
}

// ---------- Cast lookup ----------

export async function getCastByHash(hash: string): Promise<CastRecord> {
  // Try Pinata v3 API first (has cast lookup by hash)
  const res = await fetch(`${PINATA_V3_API}/casts/${hash}`, {
    headers: { Authorization: `Bearer ${getPinataJwt()}` },
  });

  if (res.ok) {
    const data = await res.json();
    const cast = data?.cast ?? data;
    return mapPinataCast(cast);
  }

  // Fallback error
  const text = await res.text();
  throw new Error(`Pinata getCastByHash failed: ${res.status} ${text}`);
}

export async function getCastByUrl(url: string): Promise<CastRecord> {
  // Parse Warpcast URL: https://warpcast.com/<username>/<hash-prefix>
  const match = url.match(
    /warpcast\.com\/([^/]+)\/(0x[a-fA-F0-9]+)/
  );

  if (match) {
    const hashPrefix = match[2];
    // Try v3 API with partial hash
    return getCastByHash(hashPrefix);
  }

  throw new Error(
    "Invalid Warpcast URL. Expected format: https://warpcast.com/<username>/<hash>"
  );
}

export async function getUserFidsByAddress(
  address: string
): Promise<number[]> {
  // Hub API doesn't have address→FID lookup directly.
  // We'll use Pinata v3 API if available.
  try {
    const res = await fetch(
      `${PINATA_V3_API}/users?address=${address.toLowerCase()}`,
      { headers: { Authorization: `Bearer ${getPinataJwt()}` } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const users = data?.users ?? data?.data;
    if (!Array.isArray(users)) return [];
    return users.map((u: { fid: number }) => u.fid);
  } catch {
    return [];
  }
}

export async function verifyCastAuthor(
  castHash: string,
  walletAddress: string
): Promise<{ verified: boolean; castAuthorFid: number; walletFids: number[] }> {
  const cast = await getCastByHash(castHash);

  // Get verified addresses for the cast author via Hub API (free)
  const verifiedAddresses = await getVerificationsByFid(cast.authorFid);
  const normalizedWallet = walletAddress.toLowerCase();
  const verified = verifiedAddresses.includes(normalizedWallet);

  // Also try v3 API for address→FID as fallback
  const walletFids = verified
    ? [cast.authorFid]
    : await getUserFidsByAddress(walletAddress);

  return {
    verified: verified || walletFids.includes(cast.authorFid),
    castAuthorFid: cast.authorFid,
    walletFids: verified ? [cast.authorFid] : walletFids,
  };
}

// ---------- Mapping ----------

function mapPinataCast(raw: Record<string, unknown>): CastRecord {
  // Pinata v3 cast response format
  const authorFid = (raw.author_fid ?? raw.fid ?? (raw.author as Record<string, unknown>)?.fid) as number;
  const hash = (raw.hash ?? raw.cast_hash) as string;
  const text = (raw.text ?? raw.content ?? "") as string;
  const timestamp = (raw.timestamp ?? raw.created_at ?? raw.published_at) as string;

  // Author info may be embedded or need separate lookup
  const author = raw.author as Record<string, unknown> | undefined;
  const authorUsername = (author?.username ?? raw.author_username ?? `fid:${authorFid}`) as string;
  const authorPfpUrl = (author?.pfp_url ?? author?.pfp ?? raw.author_pfp_url) as string | undefined;

  // Embeds / images
  const embeds = (raw.embeds ?? raw.images ?? []) as Array<Record<string, unknown>>;
  const imageEmbed = embeds.find(
    (e) =>
      typeof e.url === "string" &&
      /\.(png|jpg|jpeg|gif|webp)/i.test(e.url as string)
  );

  return {
    hash,
    url: `https://warpcast.com/${authorUsername}/${hash.slice(0, 10)}`,
    text,
    authorFid,
    authorUsername,
    authorPfpUrl: authorPfpUrl || undefined,
    publishedAt: timestamp,
    embedImageUrl: imageEmbed ? (imageEmbed.url as string) : undefined,
  };
}
