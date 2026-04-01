import { z } from "zod/v4";

export const castUrlSchema = z.string().url().refine(
  (url) => {
    try {
      const u = new URL(url);
      return u.hostname === "warpcast.com" && u.pathname.split("/").length >= 3;
    } catch {
      return false;
    }
  },
  { message: "有効な Warpcast URL を入力してください" }
);

export const castHashSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]+$/, "有効な Cast hash ではありません");

export const mintDraftSchema = z.object({
  castHash: castHashSchema,
  style: z.enum(["midnight", "paper", "neon", "minimal"]),
  includeImage: z.boolean(),
  mintPriceEth: z
    .string()
    .refine((v) => !isNaN(Number(v)) && Number(v) >= 0, "価格は0以上にしてください"),
  royaltyBps: z.number().int().min(0).max(1000),
  initialSupply: z.number().int().min(1).max(100),
});

export const verifyAuthorSchema = z
  .object({
    castHash: castHashSchema,
    walletAddress: z
      .string()
      .regex(/^0x[a-fA-F0-9]{40}$/, "有効なウォレットアドレスではありません")
      .optional(),
    fid: z.number().int().positive().optional(),
  })
  .refine((d) => d.walletAddress !== undefined || d.fid !== undefined, {
    message: "walletAddress または fid が必要です",
  });

export const uploadSchema = z.object({
  castHash: castHashSchema,
  style: z.enum(["midnight", "paper", "neon", "minimal"]),
  includeImage: z.boolean(),
  mintPriceEth: z.string(),
});

export function parseCastUrl(url: string): { username: string; hash: string } | null {
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length >= 2) {
      return { username: parts[0], hash: parts[1] };
    }
    return null;
  } catch {
    return null;
  }
}
