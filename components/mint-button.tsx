"use client";

import { useState } from "react";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useSendTransaction,
  useWaitForTransactionReceipt,
  useSwitchChain,
} from "wagmi";
import { base } from "wagmi/chains";
import { parseEther } from "viem";
import { CAST_NFT_ABI, getContractAddress } from "@/lib/contract";
import { prepareTransaction } from "@/lib/erc8021";
import { truncateAddress } from "@/lib/utils";
import type { MintDraft, UploadResult } from "@/lib/types";
import { StatusBanner } from "./status-banner";
import { basescanUrl, warpcastComposeUrl } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

type Props = {
  draft: MintDraft;
  castUrl: string;
  castAuthor: string;
  farcasterAddress: string | null;
  farcasterFid: number | null;
  onBack: () => void;
};

type MintState =
  | "idle"
  | "verifying"
  | "uploading"
  | "confirming"
  | "minting"
  | "success"
  | "error";

type MintWalletType = "farcaster" | "external";

export function MintButton({ draft, castUrl, castAuthor, farcasterAddress, farcasterFid, onBack }: Props) {
  const { t } = useI18n();
  const { address, isConnected, chainId } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const { sendTransactionAsync } = useSendTransaction();

  const [state, setState] = useState<MintState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [mintWalletType, setMintWalletType] = useState<MintWalletType>("farcaster");

  useWaitForTransactionReceipt({
    hash: txHash as `0x${string}` | undefined,
  });

  // Farcaster ウォレットが wagmi の現在の接続と一致しているか
  const isFarcasterWalletActive =
    !!farcasterAddress &&
    !!address &&
    address.toLowerCase() === farcasterAddress.toLowerCase();

  // 選択されたミント用ウォレットが実際に使える状態か
  const mintReady =
    mintWalletType === "farcaster"
      ? isFarcasterWalletActive
      : isConnected && !isFarcasterWalletActive;

  const isWrongNetwork = chainId !== base.id;

  const getWalletName = (id: string) => {
    switch (id) {
      case "coinbaseWalletSDK": return "Coinbase Wallet";
      case "walletConnect": return "WalletConnect";
      default: return id;
    }
  };

  const handleMint = async () => {
    // 検証用アドレス: farcasterAddress があればそれを使う、なければ wagmi アドレス
    const verificationAddress = farcasterAddress ?? address;
    if (!verificationAddress || !address) return;
    setError(null);

    try {
      // Step 1: 著者確認
      // MiniApp context: FID で直接確認（優先）
      // Browser context: ウォレットアドレスで確認（フォールバック）
      setState("verifying");
      const verifyBody: Record<string, unknown> = { castHash: draft.castHash };
      if (farcasterFid !== null) {
        verifyBody.fid = farcasterFid;
      } else {
        verifyBody.walletAddress = verificationAddress;
      }
      const verifyRes = await fetch("/api/verify-author", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(verifyBody),
      });
      const verifyData = await verifyRes.json();
      if (!verifyData.verified) {
        setError(t.authorMismatch);
        setState("error");
        return;
      }

      // Step 2: IPFS アップロード
      setState("uploading");
      const uploadRes = await fetch("/api/upload-to-ipfs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          castHash: draft.castHash,
          style: draft.style,
          includeImage: draft.includeImage,
          mintPriceEth: draft.mintPriceEth,
        }),
      });
      if (!uploadRes.ok) {
        throw new Error(t.ipfsUploadFailed);
      }
      const upload: UploadResult = await uploadRes.json();
      setUploadResult(upload);

      // Step 3: トランザクション送信（選択されたミント用ウォレットで実行）
      setState("minting");
      const mintPrice = parseEther(draft.mintPriceEth || "0");
      const totalValue = mintPrice * BigInt(draft.initialSupply);

      const castHashBytes = draft.castHash.startsWith("0x")
        ? (draft.castHash as `0x${string}`)
        : (`0x${draft.castHash}` as `0x${string}`);
      const paddedHash = castHashBytes.padEnd(66, "0") as `0x${string}`;

      const tx = prepareTransaction(
        CAST_NFT_ABI,
        "createAndMint",
        [
          paddedHash,
          castUrl,
          upload.metadataUri,
          mintPrice,
          BigInt(draft.royaltyBps),
          BigInt(draft.initialSupply),
        ],
        getContractAddress()
      );

      const hash = await sendTransactionAsync({
        to: tx.to,
        data: tx.data,
        value: totalValue,
      });

      setTxHash(hash);
      setState("success");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t.mintFailed;
      if (message.includes("User rejected") || message.includes("denied")) {
        setError(t.transactionCancelled);
      } else {
        setError(message);
      }
      setState("error");
    }
  };

  // Success view
  if (state === "success" && txHash) {
    const shareText = `${t.shareText}\n\n${castUrl}`;
    return (
      <div className="w-full max-w-xl mx-auto space-y-4">
        <StatusBanner type="success" message={t.mintComplete} />
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-3">
          <p className="text-sm text-gray-400">{t.transactionHash}</p>
          <p className="font-mono text-sm break-all">{txHash}</p>

          <div className="flex flex-col gap-2 pt-4">
            <a
              href={basescanUrl(txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-center transition-colors"
            >
              {t.viewOnBasescan}
            </a>
            {uploadResult && (
              <p className="text-xs text-gray-400 break-all">
                Metadata: {uploadResult.metadataUri}
              </p>
            )}
            <a
              href={warpcastComposeUrl(shareText)}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-center transition-colors"
            >
              {t.shareOnWarpcast}
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Confirm & mint view
  return (
    <div className="w-full max-w-xl mx-auto space-y-4">
      <button onClick={onBack} className="text-sm text-gray-400 hover:text-white">
        {t.back}
      </button>

      {error && (
        <StatusBanner
          type="error"
          message={error}
          onDismiss={() => { setError(null); setState("idle"); }}
        />
      )}

      {isWrongNetwork && (
        <StatusBanner type="warning" message={t.connectToBaseSepolia} />
      )}

      <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
        <h3 className="text-lg font-bold">{t.confirmTitle}</h3>

        {/* Mint details */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">{t.castLabel}</span>
            <span className="truncate ml-4">@{castAuthor}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">{t.styleConfirmLabel}</span>
            <span>{draft.style}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">{t.quantityLabel}</span>
            <span>{draft.initialSupply}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">{t.mintPriceConfirmLabel}</span>
            <span>{draft.mintPriceEth} ETH</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">{t.royaltyConfirmLabel}</span>
            <span>{(draft.royaltyBps / 100).toFixed(1)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">{t.totalPaymentLabel}</span>
            <span className="font-bold">
              {(Number(draft.mintPriceEth) * draft.initialSupply).toFixed(6)} ETH
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">{t.chainLabel}</span>
            <span>Base</span>
          </div>
        </div>

        {/* Wallet section */}
        <div className="space-y-4 pt-3 border-t border-white/10">

          {/* Verification wallet (always Farcaster, required) */}
          <div>
            <p className="text-xs text-gray-400 mb-1.5">{t.verificationWalletLabel}</p>
            {farcasterAddress ? (
              <div className="flex items-center gap-2 text-sm">
                <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
                <span className="text-green-300">
                  {t.farcasterWalletOption} ({truncateAddress(farcasterAddress)})
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm">
                <span className="w-2 h-2 rounded-full bg-yellow-400 shrink-0" />
                <span className="text-yellow-300 text-xs">{t.farcasterWalletRequired}</span>
              </div>
            )}
          </div>

          {/* Mint wallet selector (only shown when Farcaster is detected) */}
          {farcasterAddress && (
            <div>
              <p className="text-xs text-gray-400 mb-2">{t.mintWalletLabel}</p>
              <div className="space-y-2">

                {/* Option: Farcaster Wallet */}
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="mintWallet"
                    value="farcaster"
                    checked={mintWalletType === "farcaster"}
                    onChange={() => setMintWalletType("farcaster")}
                    className="accent-purple-500"
                  />
                  <span className="text-sm">
                    {t.farcasterWalletOption}
                    <span className="ml-2 text-xs text-gray-400">
                      ({truncateAddress(farcasterAddress)})
                    </span>
                  </span>
                </label>
                {/* Switch button if Farcaster wallet not active */}
                {mintWalletType === "farcaster" && !isFarcasterWalletActive && (
                  <div className="ml-6">
                    <button
                      onClick={() => {
                        const injected = connectors.find((c) => c.id === "injected");
                        if (injected) connect({ connector: injected });
                      }}
                      className="text-xs px-3 py-1.5 bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 rounded-lg transition-colors"
                    >
                      {t.switchToFarcasterWallet}
                    </button>
                  </div>
                )}

                {/* Option: External EVM Wallet */}
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="mintWallet"
                    value="external"
                    checked={mintWalletType === "external"}
                    onChange={() => setMintWalletType("external")}
                    className="accent-purple-500"
                  />
                  <span className="text-sm">
                    {t.externalWalletOption}
                    {mintWalletType === "external" && !isFarcasterWalletActive && isConnected && address && (
                      <span className="ml-2 text-xs text-gray-400">
                        ({truncateAddress(address)})
                      </span>
                    )}
                  </span>
                </label>
                {/* Connector picker for external wallet */}
                {mintWalletType === "external" && (
                  <div className="ml-6 space-y-1.5">
                    {isConnected && !isFarcasterWalletActive ? (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                        <span className="text-green-300">{truncateAddress(address!)}</span>
                        <button
                          onClick={() => disconnect()}
                          className="text-gray-500 hover:text-gray-300 underline"
                        >
                          {t.disconnect}
                        </button>
                      </div>
                    ) : (
                      <>
                        <p className="text-xs text-gray-500 mb-1">{t.connectExternalWallet}</p>
                        {connectors
                          .filter((c) => c.id !== "injected")
                          .map((c) => (
                            <button
                              key={c.uid}
                              onClick={() => connect({ connector: c })}
                              className="block w-full text-left text-xs px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                            >
                              {getWalletName(c.id)}
                            </button>
                          ))}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action button */}
        {isWrongNetwork ? (
          <button
            onClick={() => switchChain({ chainId: base.id })}
            className="w-full py-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg font-medium transition-colors"
          >
            {t.switchToBaseSepolia}
          </button>
        ) : (
          <button
            onClick={handleMint}
            disabled={
              (state !== "idle" && state !== "error") ||
              !isConnected ||
              (!!farcasterAddress && !mintReady)
            }
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
          >
            {state === "verifying" && t.verifyingAuthor}
            {state === "uploading" && t.uploadingToIpfs}
            {state === "minting" && t.sendingTransaction}
            {(state === "idle" || state === "error") && t.executeMint}
          </button>
        )}
      </div>
    </div>
  );
}
