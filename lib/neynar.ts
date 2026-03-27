import type { CastRecord } from "./types";

// Pinata Hub API (FREE, no auth required)
const HUB_API = "https://hub.pinata.cloud/v1";

// Farcaster epoch: 2021-01-01T00:00:00Z
const FARCASTER_EPOCH = 1609459200;

// ---------- Hub API helpers ----------

async function getUserDataByFid(
  fid: number,
  userDataType: number
): Promise<string | undefined> {
  const res = await fetch(
    `${HUB_API}/userDataByFid?fid=${fid}&user_data_type=${userDataType}`
  );
  if (!res.ok) return undefined;
  const data = await res.json();
  return data?.data?.userDataBody?.value;
}

async function getUserProfile(
  fid: number
): Promise<{ username: string; pfpUrl?: string; displayName?: string }> {
  const [username, pfpUrl, displayName] = await Promise.all([
    getUserDataByFid(fid, 6), // USER_DATA_TYPE_USERNAME
    getUserDataByFid(fid, 1), // USER_DATA_TYPE_PFP
    getUserDataByFid(fid, 2), // USER_DATA_TYPE_DISPLAY
  ]);
  return {
    username: username ?? `fid:${fid}`,
    pfpUrl,
    displayName,
  };
}

async function getFidByUsername(username: string): Promise<number> {
  const res = await fetch(
    `${HUB_API}/userNameProofByName?name=${encodeURIComponent(username)}`
  );
  if (!res.ok) {
    throw new Error(`Username not found: ${username}`);
  }
  const data = await res.json();
  return data.fid;
}

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

/**
 * Look up a cast using Hub API castById (requires FID + full hash).
 */
async function getCastFromHub(
  fid: number,
  hash: string
): Promise<CastRecord> {
  const res = await fetch(
    `${HUB_API}/castById?fid=${fid}&hash=${encodeURIComponent(hash)}`
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Hub castById failed: ${res.status} ${text}`);
  }
  const msg = await res.json();
  const profile = await getUserProfile(fid);
  return mapHubMessage(msg, fid, profile);
}

/**
 * Find a cast by scanning recent casts for a matching hash prefix.
 * Used when we only have a short hash from a Warpcast URL.
 */
async function findCastByHashPrefix(
  fid: number,
  hashPrefix: string
): Promise<CastRecord> {
  const prefix = hashPrefix.toLowerCase();
  let pageToken = "";

  for (let page = 0; page < 10; page++) {
    const url = `${HUB_API}/castsByFid?fid=${fid}&pageSize=100&reverse=true${
      pageToken ? `&pageToken=${pageToken}` : ""
    }`;
    const res = await fetch(url);
    if (!res.ok) break;
    const data = await res.json();
    const messages = data?.messages;
    if (!Array.isArray(messages)) break;

    const found = messages.find(
      (m: Record<string, unknown>) =>
        (m.hash as string)?.toLowerCase().startsWith(prefix)
    );

    if (found) {
      const profile = await getUserProfile(fid);
      return mapHubMessage(found, fid, profile);
    }

    if (!data.nextPageToken) break;
    pageToken = data.nextPageToken;
  }

  throw new Error(`Cast not found for fid=${fid} hash prefix=${hashPrefix}`);
}

/**
 * Get a cast by full hash. Requires FID.
 * If FID is not provided, tries Pinata v3 API as fallback.
 */
export async function getCastByHash(
  hash: string,
  fid?: number
): Promise<CastRecord> {
  if (fid) {
    return getCastFromHub(fid, hash);
  }

  // Without FID, try Pinata v3 API if PINATA_JWT is available
  const jwt = process.env.PINATA_JWT;
  if (jwt) {
    try {
      const res = await fetch(
        `https://api.pinata.cloud/v3/farcaster/casts/${hash}`,
        { headers: { Authorization: `Bearer ${jwt}` } }
      );
      if (res.ok) {
        const data = await res.json();
        const cast = data?.cast ?? data?.data ?? data;
        return mapPinataCast(cast);
      }
    } catch {
      // Fall through
    }
  }

  throw new Error(
    "Cannot look up cast by hash alone without FID. Provide a Warpcast URL instead."
  );
}

/**
 * Get a cast by Warpcast URL.
 * Parses username + short hash, resolves FID via Hub API, then scans casts.
 */
export async function getCastByUrl(url: string): Promise<CastRecord> {
  // Support various Warpcast URL formats:
  //   https://warpcast.com/username/0xabc123
  //   https://warpcast.com/username/abc123  (no 0x prefix)
  const match = url.match(/warpcast\.com\/([^/?#]+)\/(?:0x)?([a-fA-F0-9]+)/);
  if (!match) {
    throw new Error(
      `Invalid Warpcast URL: "${url}". Expected: https://warpcast.com/<username>/<hash>`
    );
  }

  const username = match[1];
  const shortHash = `0x${match[2]}`; // Normalize to 0x prefix

  // Step 1: Get FID from username
  const fid = await getFidByUsername(username);

  // Step 2: If hash looks full (64 hex chars after 0x), use castById directly
  if (shortHash.length >= 42) {
    return getCastFromHub(fid, shortHash);
  }

  // Step 3: Short hash — scan recent casts to find it
  return findCastByHashPrefix(fid, shortHash);
}

export async function verifyCastAuthor(
  castHash: string,
  walletAddress: string,
  authorFid?: number
): Promise<{ verified: boolean; castAuthorFid: number; walletFids: number[] }> {
  // If we have the author FID, use it directly
  let fid = authorFid;

  if (!fid) {
    // Need to look up the cast to get the author FID
    const cast = await getCastByHash(castHash, authorFid);
    fid = cast.authorFid;
  }

  // Get verified addresses for the cast author via Hub API (free)
  const verifiedAddresses = await getVerificationsByFid(fid);
  const normalizedWallet = walletAddress.toLowerCase();
  const verified = verifiedAddresses.includes(normalizedWallet);

  return {
    verified,
    castAuthorFid: fid,
    walletFids: verified ? [fid] : [],
  };
}

// ---------- Mapping: Hub API message → CastRecord ----------

function mapHubMessage(
  msg: Record<string, unknown>,
  fid: number,
  profile: { username: string; pfpUrl?: string }
): CastRecord {
  const data = msg.data as Record<string, unknown>;
  const castAddBody = data?.castAddBody as Record<string, unknown> | undefined;
  const hash = msg.hash as string;
  const text = (castAddBody?.text ?? "") as string;

  // Farcaster timestamp → ISO string
  const farcasterTs = data?.timestamp as number | undefined;
  const publishedAt = farcasterTs
    ? new Date((farcasterTs + FARCASTER_EPOCH) * 1000).toISOString()
    : new Date().toISOString();

  // Extract image embeds
  const embeds = (castAddBody?.embeds ?? []) as Array<Record<string, unknown>>;
  const imageEmbed = embeds.find(
    (e) =>
      typeof e.url === "string" &&
      /\.(png|jpg|jpeg|gif|webp)/i.test(e.url as string)
  );

  return {
    hash,
    url: `https://warpcast.com/${profile.username}/${hash.slice(0, 10)}`,
    text,
    authorFid: fid,
    authorUsername: profile.username,
    authorPfpUrl: profile.pfpUrl || undefined,
    publishedAt,
    embedImageUrl: imageEmbed ? (imageEmbed.url as string) : undefined,
  };
}

// ---------- Mapping: Pinata v3 response → CastRecord (fallback) ----------

function mapPinataCast(raw: Record<string, unknown>): CastRecord {
  const authorFid = (raw.author_fid ??
    raw.fid ??
    (raw.author as Record<string, unknown>)?.fid) as number;
  const hash = (raw.hash ?? raw.cast_hash) as string;
  const text = (raw.text ?? raw.content ?? "") as string;
  const timestamp = (raw.timestamp ??
    raw.created_at ??
    raw.published_at) as string;

  const author = raw.author as Record<string, unknown> | undefined;
  const authorUsername = (author?.username ??
    raw.author_username ??
    `fid:${authorFid}`) as string;
  const authorPfpUrl = (author?.pfp_url ??
    author?.pfp ??
    raw.author_pfp_url) as string | undefined;

  const embeds = (raw.embeds ?? raw.images ?? []) as Array<
    Record<string, unknown>
  >;
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
