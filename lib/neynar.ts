import type { CastRecord } from "./types";

// Warpcast public API (free, no auth)
const WARPCAST_API = "https://api.warpcast.com/v2";

// Pinata Hub API (free, no auth) - used for verifications
const HUB_API = "https://hub.pinata.cloud/v1";

// ---------- Warpcast API ----------

async function warpcastGetUser(username: string): Promise<{
  fid: number;
  username: string;
  displayName?: string;
  pfpUrl?: string;
}> {
  const res = await fetch(
    `${WARPCAST_API}/user-by-username?username=${encodeURIComponent(username)}`
  );
  if (!res.ok) {
    throw new Error(`User not found: ${username}`);
  }
  const data = await res.json();
  const user = data?.result?.user;
  if (!user) throw new Error(`User not found: ${username}`);
  return {
    fid: user.fid,
    username: user.username,
    displayName: user.displayName,
    pfpUrl: user.pfp?.url,
  };
}

async function warpcastGetCastsByFid(
  fid: number,
  limit = 25
): Promise<Record<string, unknown>[]> {
  const res = await fetch(
    `${WARPCAST_API}/casts?fid=${fid}&limit=${limit}`
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data?.result?.casts ?? [];
}

async function warpcastGetThreadCasts(
  hash: string
): Promise<Record<string, unknown> | null> {
  const res = await fetch(
    `${WARPCAST_API}/thread-casts?castHash=${encodeURIComponent(hash)}`
  );
  if (!res.ok) return null;
  const data = await res.json();
  const casts = data?.result?.casts;
  if (Array.isArray(casts) && casts.length > 0) {
    return casts[0] as Record<string, unknown>;
  }
  return null;
}

// ---------- Cast lookup ----------

export async function getCastByUrl(url: string): Promise<CastRecord> {
  // Support various Farcaster URL formats:
  //   https://warpcast.com/username/0xabc123
  //   https://farcaster.xyz/username/0xabc123
  //   https://warpcast.com/username/abc123  (no 0x prefix)
  const match = url.match(
    /(?:warpcast\.com|farcaster\.xyz)\/([^/?#]+)\/(?:0x)?([a-fA-F0-9]+)/
  );
  if (!match) {
    throw new Error(
      `Invalid URL: "${url}". Expected: https://warpcast.com/ or https://farcaster.xyz/ URL`
    );
  }

  const username = match[1];
  const shortHash = `0x${match[2]}`;

  // Step 1: Get user info
  const user = await warpcastGetUser(username);

  // Step 2: Try thread-casts with the short hash (resolves full hash)
  const castFromThread = await warpcastGetThreadCasts(shortHash);
  if (castFromThread) {
    return mapWarpcastCast(castFromThread);
  }

  // Step 3: Fallback - scan recent casts for matching hash prefix
  const casts = await warpcastGetCastsByFid(user.fid, 50);
  const prefix = shortHash.toLowerCase();
  const found = casts.find(
    (c) => ((c.hash as string) ?? "").toLowerCase().startsWith(prefix)
  );

  if (found) {
    return mapWarpcastCast(found);
  }

  throw new Error(`Cast not found for @${username} with hash ${shortHash}`);
}

export async function getCastByHash(
  hash: string,
  fid?: number
): Promise<CastRecord> {
  // Normalize hash
  const fullHash = hash.startsWith("0x") ? hash : `0x${hash}`;

  // Try thread-casts endpoint (works with full hash)
  const castFromThread = await warpcastGetThreadCasts(fullHash);
  if (castFromThread) {
    return mapWarpcastCast(castFromThread);
  }

  // If we have FID, scan recent casts
  if (fid) {
    const casts = await warpcastGetCastsByFid(fid, 50);
    const prefix = fullHash.toLowerCase();
    const found = casts.find(
      (c) => ((c.hash as string) ?? "").toLowerCase().startsWith(prefix)
    );
    if (found) {
      return mapWarpcastCast(found);
    }
  }

  throw new Error(`Cast not found: ${fullHash}`);
}

export async function verifyCastAuthor(
  castHash: string,
  walletAddress: string,
  authorFid?: number
): Promise<{
  verified: boolean;
  castAuthorFid: number;
  walletFids: number[];
}> {
  // Get the cast to find the author FID
  const cast = await getCastByHash(castHash, authorFid);
  const fid = cast.authorFid;

  // Try Hub API for verifications (preferred, free)
  let verifiedAddresses = await getVerificationsByFidFromHub(fid);

  // If Hub API is down, try Warpcast API (ethWallets from user endpoint)
  if (verifiedAddresses.length === 0) {
    verifiedAddresses = await getWalletsByFid(fid);
  }

  const normalizedWallet = walletAddress.toLowerCase();
  const verified = verifiedAddresses.includes(normalizedWallet);

  return {
    verified,
    castAuthorFid: fid,
    walletFids: verified ? [fid] : [],
  };
}

// ---------- Wallet verification helpers ----------

async function getVerificationsByFidFromHub(fid: number): Promise<string[]> {
  try {
    const res = await fetch(`${HUB_API}/verificationsByFid?fid=${fid}`);
    if (!res.ok) return [];
    const data = await res.json();
    const messages = data?.messages;
    if (!Array.isArray(messages)) return [];
    return messages
      .map(
        (m: Record<string, unknown>) =>
          (m?.data as Record<string, unknown>)
            ?.verificationAddAddressBody as
            | Record<string, unknown>
            | undefined
      )
      .filter(Boolean)
      .map((body) => (body!.address as string)?.toLowerCase())
      .filter(Boolean);
  } catch {
    return [];
  }
}

async function getWalletsByFid(fid: number): Promise<string[]> {
  try {
    // Use Warpcast user endpoint which includes ethWallets
    const res = await fetch(`${WARPCAST_API}/user?fid=${fid}`);
    if (!res.ok) return [];
    const data = await res.json();
    const extras = data?.result?.user?.extras;
    const ethWallets = extras?.ethWallets;
    if (!Array.isArray(ethWallets)) return [];
    return ethWallets.map((w: string) => w.toLowerCase());
  } catch {
    return [];
  }
}

// ---------- Mapping: Warpcast response → CastRecord ----------

function mapWarpcastCast(raw: Record<string, unknown>): CastRecord {
  const hash = raw.hash as string;
  const text = raw.text as string;

  const author = raw.author as Record<string, unknown>;
  const authorFid = author?.fid as number;
  const authorUsername = author?.username as string;
  const authorPfpUrl = (author?.pfp as Record<string, unknown>)?.url as
    | string
    | undefined;

  // Warpcast timestamp is in milliseconds
  const timestamp = raw.timestamp as number;
  const publishedAt = timestamp
    ? new Date(timestamp).toISOString()
    : new Date().toISOString();

  // Extract image embeds
  const embeds = raw.embeds as Record<string, unknown> | undefined;
  const images = (embeds?.images ?? []) as Array<Record<string, unknown>>;
  const imageEmbed =
    images.length > 0 ? (images[0].url as string) : undefined;

  return {
    hash,
    url: `https://warpcast.com/${authorUsername}/${hash.slice(0, 10)}`,
    text,
    authorFid,
    authorUsername,
    authorPfpUrl: authorPfpUrl || undefined,
    publishedAt,
    embedImageUrl: imageEmbed,
  };
}
