import { NextResponse } from "next/server";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://cast-to-nft.vercel.app";

export async function GET() {
  const manifest = {
    accountAssociation: {
      header: process.env.FARCASTER_MANIFEST_HEADER || "",
      payload: process.env.FARCASTER_MANIFEST_PAYLOAD || "",
      signature: process.env.FARCASTER_MANIFEST_SIGNATURE || "",
    },
    miniapp: {
      version: "1",
      name: "Cast-to-NFT",
      subtitle: "Turn your Casts into NFTs",
      description:
        "Mint your Farcaster Casts as ERC-1155 NFTs on Base. Only the original author can mint their own Cast.",
      iconUrl: `${APP_URL}/icon.png`,
      splashImageUrl: `${APP_URL}/splash.png`,
      splashBackgroundColor: "#0f0f23",
      homeUrl: APP_URL,
      webhookUrl: `${APP_URL}/api/webhook`,
      primaryCategory: "art-creativity",
      tags: ["nft", "farcaster", "base", "mint", "cast"],
      heroImageUrl: `${APP_URL}/og-image.png`,
      screenshotUrls: [
        `${APP_URL}/screenshot1.png`,
        `${APP_URL}/screenshot2.png`,
        `${APP_URL}/screenshot3.png`,
      ],
      tagline: "Cast to NFT on Base",
      ogTitle: "Cast-to-NFT",
      ogDescription:
        "Turn your Farcaster Casts into collectible NFTs on Base",
      ogImageUrl: `${APP_URL}/og-image.png`,
      noindex: false,
      requiredChains: ["eip155:84532"],
      requiredCapabilities: [],
    },
  };

  return NextResponse.json(manifest);
}
