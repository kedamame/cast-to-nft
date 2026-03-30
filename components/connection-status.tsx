"use client";

import { useAccount } from "wagmi";
import { useFarcasterMiniApp } from "@/lib/farcaster";
import { useI18n } from "@/lib/i18n";
import { truncateAddress } from "@/lib/utils";

export function ConnectionStatus() {
  const { address, isConnected } = useAccount();
  const { isInMiniApp, user } = useFarcasterMiniApp();
  const { t } = useI18n();

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 text-xs border-b border-white/5 bg-white/[0.02]">
      {/* Farcaster status */}
      <div className="flex items-center gap-1.5">
        {isInMiniApp ? (
          <>
            <span className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-green-300">
              {t.farcasterConnected}
              {user ? ` (@${user.username})` : ""}
            </span>
          </>
        ) : (
          <>
            <span className="w-2 h-2 rounded-full bg-gray-500" />
            <span className="text-gray-400">{t.farcasterNotDetected}</span>
          </>
        )}
      </div>

      {/* Wallet status */}
      <div className="flex items-center gap-1.5">
        {isConnected && address ? (
          <>
            <span className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-green-300">
              {t.walletConnected} ({truncateAddress(address)})
            </span>
          </>
        ) : (
          <>
            <span className="w-2 h-2 rounded-full bg-yellow-400" />
            <span className="text-yellow-300">{t.walletNotConnected}</span>
          </>
        )}
      </div>
    </div>
  );
}
