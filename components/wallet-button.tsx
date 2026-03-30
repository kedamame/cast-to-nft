"use client";

import { useState, useEffect, useRef } from "react";
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
  const [showModal, setShowModal] = useState(false);
  const autoConnectAttempted = useRef(false);

  // MiniApp: auto-connect injected wallet on load
  useEffect(() => {
    if (!isInMiniApp || isConnected || autoConnectAttempted.current) return;
    autoConnectAttempted.current = true;

    const timer = setTimeout(() => {
      const connector =
        connectors.find((c) => c.id === "injected") ?? connectors[0];
      if (connector) {
        connect({ connector });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [isInMiniApp, isConnected, connectors, connect]);

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

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-colors"
      >
        {t.connectWallet}
      </button>

      {/* Wallet selection modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60"
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-full sm:max-w-sm bg-gray-900 border border-white/10 rounded-t-2xl sm:rounded-2xl p-6 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-4">{t.connectWallet}</h3>
            {connectors.map((connector) => (
              <button
                key={connector.uid}
                onClick={() => {
                  connect({ connector });
                  setShowModal(false);
                }}
                className="w-full px-4 py-3 text-left text-sm bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
              >
                {getWalletName(connector.id)}
              </button>
            ))}
            <button
              onClick={() => setShowModal(false)}
              className="w-full px-4 py-3 text-sm text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
