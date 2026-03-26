"use client";

import { useState } from "react";
import {
  useAccount,
  useSendTransaction,
  useWaitForTransactionReceipt,
  useSwitchChain,
} from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { parseEther } from "viem";
import { CAST_NFT_ABI, getContractAddress } from "@/lib/contract";
import { prepareTransaction } from "@/lib/erc8021";
import type { MintDraft, UploadResult } from "@/lib/types";
import { StatusBanner } from "./status-banner";
import { basescanUrl, warpcastComposeUrl } from "@/lib/utils";

type Props = {
  draft: MintDraft;
  castUrl: string;
  castAuthor: string;
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

export function MintButton({ draft, castUrl, castAuthor, onBack }: Props) {
  const { address, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const { sendTransactionAsync } = useSendTransaction();

  const [state, setState] = useState<MintState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

  const { isLoading: txPending, isSuccess: txSuccess } =
    useWaitForTransactionReceipt({
      hash: txHash as `0x${string}` | undefined,
    });

  const isWrongNetwork = chainId !== baseSepolia.id;

  const handleMint = async () => {
    if (!address) return;
    setError(null);

    try {
      // Step 1: Verify author
      setState("verifying");
      const verifyRes = await fetch("/api/verify-author", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          castHash: draft.castHash,
          walletAddress: address,
        }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyData.verified) {
        setError("このウォレットは Cast 著者と一致しません。");
        setState("error");
        return;
      }

      // Step 2: Upload to IPFS
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
        throw new Error("IPFS への保存に失敗しました。");
      }
      const upload: UploadResult = await uploadRes.json();
      setUploadResult(upload);

      // Step 3: Send transaction with ERC-8021 builder code
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
      const message =
        err instanceof Error ? err.message : "ミントに失敗しました。";
      if (message.includes("User rejected") || message.includes("denied")) {
        setError("トランザクションがキャンセルされました。");
      } else {
        setError(message);
      }
      setState("error");
    }
  };

  // Success view
  if (state === "success" && txHash) {
    const shareText = `My Cast is now an NFT on Base!\n\n${castUrl}`;
    return (
      <div className="w-full max-w-xl mx-auto space-y-4">
        <StatusBanner type="success" message="ミント完了！" />
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-3">
          <p className="text-sm text-gray-400">トランザクション Hash</p>
          <p className="font-mono text-sm break-all">{txHash}</p>

          <div className="flex flex-col gap-2 pt-4">
            <a
              href={basescanUrl(txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-center transition-colors"
            >
              Basescan で確認
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
              Warpcast でシェア
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Confirm & mint view
  return (
    <div className="w-full max-w-xl mx-auto space-y-4">
      <button
        onClick={onBack}
        className="text-sm text-gray-400 hover:text-white"
      >
        ← 戻る
      </button>

      {error && (
        <StatusBanner
          type="error"
          message={error}
          onDismiss={() => {
            setError(null);
            setState("idle");
          }}
        />
      )}

      {isWrongNetwork && (
        <StatusBanner
          type="warning"
          message="Base Sepolia に接続してください。"
        />
      )}

      <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
        <h3 className="text-lg font-bold">ミント内容の確認</h3>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Cast</span>
            <span className="truncate ml-4">@{castAuthor}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">スタイル</span>
            <span>{draft.style}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">枚数</span>
            <span>{draft.initialSupply}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">ミント価格</span>
            <span>{draft.mintPriceEth} ETH</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">ロイヤリティ</span>
            <span>{(draft.royaltyBps / 100).toFixed(1)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">支払い合計</span>
            <span className="font-bold">
              {(Number(draft.mintPriceEth) * draft.initialSupply).toFixed(6)}{" "}
              ETH
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">チェーン</span>
            <span>Base Sepolia</span>
          </div>
        </div>

        {isWrongNetwork ? (
          <button
            onClick={() => switchChain({ chainId: baseSepolia.id })}
            className="w-full py-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg font-medium transition-colors"
          >
            Base Sepolia に切り替え
          </button>
        ) : (
          <button
            onClick={handleMint}
            disabled={state !== "idle" && state !== "error"}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
          >
            {state === "verifying" && "著者を確認中..."}
            {state === "uploading" && "IPFS にアップロード中..."}
            {state === "minting" && "トランザクション送信中..."}
            {(state === "idle" || state === "error") && "ミント実行"}
          </button>
        )}
      </div>
    </div>
  );
}
