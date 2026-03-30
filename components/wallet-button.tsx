"use client";

import { useState, useRef, useEffect } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { truncateAddress } from "@/lib/utils";
import { useFarcasterMiniApp } from "@/lib/farcaster";
import { useI18n } from "@/lib/i18n";

export function WalletButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { isInMiniApp } = useFarcasterMiniApp();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-300 font-mono">
          {truncateAddress(address)}
        </span>
        <button
          onClick={() => disconnect()}
          className="px-3 py-1.5 text-sm bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
        >
          {t.disconnect}
        </button>
      </div>
    );
  }

  const getWalletName = (id: string) => {
    switch (id) {
      case "injected":
        return isInMiniApp ? "Farcaster Wallet" : "Browser Wallet";
      case "coinbaseWalletSDK":
        return "Coinbase Wallet";
      case "walletConnect":
        return "WalletConnect";
      default:
        return id;
    }
  };

  // MiniApp: single injected wallet button
  if (isInMiniApp) {
    const injectedConnector = connectors.find((c) => c.id === "injected");
    if (injectedConnector) {
      return (
        <button
          onClick={() => connect({ connector: injectedConnector })}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-colors"
        >
          {t.connectWallet}
        </button>
      );
    }
  }

  // Web: click-to-open dropdown
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-colors"
      >
        {t.connectWallet}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-gray-900 border border-white/10 rounded-lg shadow-xl z-50">
          {connectors.map((connector) => (
            <button
              key={connector.uid}
              onClick={() => {
                connect({ connector });
                setOpen(false);
              }}
              className="w-full px-4 py-3 text-left text-sm hover:bg-white/10 first:rounded-t-lg last:rounded-b-lg transition-colors"
            >
              {getWalletName(connector.id)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
