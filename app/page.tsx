"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import { CastUrlForm } from "@/components/cast-url-form";
import { CastPreview } from "@/components/cast-preview";
import { MintForm } from "@/components/mint-form";
import { MintButton } from "@/components/mint-button";
import { WalletButton } from "@/components/wallet-button";
import { StatusBanner } from "@/components/status-banner";
import { useFarcasterMiniApp } from "@/lib/farcaster";
import type { CastRecord, MintDraft } from "@/lib/types";
import { parseCastUrl } from "@/lib/validations";

type Step = "home" | "preview" | "setup" | "confirm";

export default function HomePage() {
  const { isConnected } = useAccount();
  const { isInMiniApp, isLoading: farcasterLoading, user, castContext } =
    useFarcasterMiniApp();

  const [step, setStep] = useState<Step>("home");
  const [cast, setCast] = useState<CastRecord | null>(null);
  const [draft, setDraft] = useState<MintDraft | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // MiniApp: cast embed から起動された場合、自動で Cast を読み込む
  useEffect(() => {
    if (farcasterLoading) return;
    if (isInMiniApp && castContext?.hash && !cast) {
      fetchCastByHash(castContext.hash);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [farcasterLoading, isInMiniApp, castContext]);

  const fetchCastByHash = async (hash: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/cast?hash=${encodeURIComponent(hash)}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCast(data.cast);
      setStep("preview");
    } catch {
      setError("Cast が見つかりませんでした。URL を確認してください。");
    } finally {
      setLoading(false);
    }
  };

  const handleUrlSubmit = useCallback(async (url: string) => {
    setLoading(true);
    setError(null);
    try {
      const parsed = parseCastUrl(url);
      const query = parsed
        ? `url=${encodeURIComponent(url)}`
        : `hash=${encodeURIComponent(url)}`;

      const res = await fetch(`/api/cast?${query}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCast(data.cast);
      setStep("preview");
    } catch {
      setError("Cast が見つかりませんでした。URL を確認してください。");
    } finally {
      setLoading(false);
    }
  }, []);

  const resetAll = () => {
    setStep("home");
    setCast(null);
    setDraft(null);
    setError(null);
  };

  // Farcaster SDK ロード中
  if (farcasterLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">読み込み中...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <h1
            className="text-xl font-bold cursor-pointer"
            onClick={resetAll}
          >
            Cast-to-NFT
          </h1>
          {isInMiniApp && (
            <span className="text-xs px-2 py-0.5 bg-purple-600/30 text-purple-300 rounded-full">
              MiniApp
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* MiniApp 内で Farcaster ユーザー情報を表示 */}
          {isInMiniApp && user && (
            <div className="flex items-center gap-2 text-sm text-gray-300">
              {user.pfpUrl && (
                <img
                  src={user.pfpUrl}
                  alt=""
                  className="w-6 h-6 rounded-full"
                />
              )}
              <span>{user.displayName || user.username}</span>
            </div>
          )}
          <WalletButton />
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        {error && (
          <StatusBanner
            type="error"
            message={error}
            onDismiss={() => setError(null)}
          />
        )}

        {/* Home */}
        {step === "home" && (
          <div className="text-center space-y-8">
            <div>
              <h2 className="text-4xl font-bold mb-4">
                Cast を NFT にしよう
              </h2>
              <p className="text-gray-400 text-lg max-w-md mx-auto">
                Farcaster の Cast を Base 上の ERC-1155 NFT として発行できます。
                著者本人のみがミント可能です。
              </p>
            </div>

            {isInMiniApp && loading ? (
              <div className="text-gray-400">Cast を読み込み中...</div>
            ) : (
              <CastUrlForm onSubmit={handleUrlSubmit} loading={loading} />
            )}
          </div>
        )}

        {/* Preview */}
        {step === "preview" && cast && (
          <div className="space-y-4">
            {!isConnected && (
              <StatusBanner
                type="info"
                message="ウォレットを接続してミントに進みましょう。"
              />
            )}
            <CastPreview
              cast={cast}
              onProceed={() => {
                if (!isConnected) {
                  setError("ウォレットを接続してください。");
                  return;
                }
                setStep("setup");
              }}
            />
          </div>
        )}

        {/* Setup */}
        {step === "setup" && cast && (
          <MintForm
            cast={cast}
            onConfirm={(d) => {
              setDraft(d);
              setStep("confirm");
            }}
            onBack={() => setStep("preview")}
          />
        )}

        {/* Confirm & Mint */}
        {step === "confirm" && cast && draft && (
          <MintButton
            draft={draft}
            castUrl={cast.url}
            castAuthor={cast.authorUsername}
            onBack={() => setStep("setup")}
          />
        )}
      </div>

      {/* Footer */}
      <footer className="text-center py-4 text-sm text-gray-500 border-t border-white/10">
        Cast-to-NFT — Built on Base
      </footer>
    </main>
  );
}
