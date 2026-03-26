import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://cast-to-nft.vercel.app";

const miniAppEmbed = {
  version: "1",
  imageUrl: `${APP_URL}/opengraph-image`,
  button: {
    title: "Mint as NFT",
    action: {
      type: "launch_miniapp",
      name: "Cast-to-NFT",
      url: APP_URL,
      splashImageUrl: `${APP_URL}/splash.png`,
      splashBackgroundColor: "#0f0f23",
    },
  },
};

export const metadata: Metadata = {
  title: "Cast-to-NFT | Farcaster Casts on Base",
  description: "Turn your Farcaster Casts into NFTs on Base",
  metadataBase: new URL(APP_URL),
  openGraph: {
    title: "Cast-to-NFT",
    description: "Turn your Farcaster Casts into NFTs on Base",
    type: "website",
    images: ["/og-image.png"],
  },
  other: {
    "fc:miniapp": JSON.stringify(miniAppEmbed),
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
