export type CastRecord = {
  hash: string;
  url: string;
  text: string;
  authorFid: number;
  authorUsername: string;
  authorPfpUrl?: string;
  publishedAt: string;
  embedImageUrl?: string;
};

export type CardStyle = "midnight" | "paper" | "neon" | "minimal";

export type MintDraft = {
  castHash: string;
  style: CardStyle;
  includeImage: boolean;
  mintPriceEth: string;
  royaltyBps: number;
  initialSupply: number;
};

export type MintStep =
  | "idle"
  | "loading"
  | "preview"
  | "setup"
  | "confirm"
  | "minting"
  | "success"
  | "error";

export type VerifyAuthorResponse = {
  verified: boolean;
  castAuthorFid: number;
  walletFids: number[];
};

export type UploadResult = {
  imageUri: string;
  metadataUri: string;
};
