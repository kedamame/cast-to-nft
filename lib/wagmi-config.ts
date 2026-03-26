"use client";

import { http, createConfig, createStorage, cookieStorage } from "wagmi";
import { baseSepolia, base } from "wagmi/chains";
import { coinbaseWallet, injected, walletConnect } from "wagmi/connectors";

const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "placeholder";

export const config = createConfig({
  chains: [baseSepolia, base],
  connectors: [
    injected({ shimDisconnect: true }),
    coinbaseWallet({ appName: "Cast-to-NFT", preference: "all" }),
    walletConnect({ projectId, showQrModal: true }),
  ],
  transports: {
    [baseSepolia.id]: http(),
    [base.id]: http(),
  },
  multiInjectedProviderDiscovery: true,
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
});
