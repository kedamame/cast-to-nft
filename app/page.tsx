"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import { CastUrlForm } from "@/components/cast-url-form";
import { CastPreview } from "@/components/cast-preview";
import { MintForm } from "@/components/mint-form";
import { MintButton } from "@/components/mint-button";
import { WalletButton } from "@/components/wallet-button";
import { StatusBanner } from "@/components/status-banner";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ConnectionStatus } from "@/components/connection-status";
import { useFarcasterMiniApp } from "@/lib/farcaster";
import { useI18n } from "@/lib/i18n";
import type { CastRecord, MintDraft } from "@/lib/types";
import { parseCastUrl } from "@/lib/validations";

type Step = "home" | "preview" | "setup" | "confirm";

export default function HomePage() {
  const { isConnected } = useAccount();
  const { isInMiniApp, isLoading: farcasterLoading, castContext } =
    useFarcasterMiniApp();
  const { t } = useI18n();

  const [step, setStep] = useState<Step>("home");
  const [cast, setCast] = useState<CastRecord | null>(null);
  const [draft, setDraft] = useState<MintDraft | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // MiniApp: cast embed から起動された場合、自動で Cast を読み込む
  useEffect(() => {
    if (farcasterLoading) return;
    if (isInMiniApp && castContext?.hash && !cast) {
      fetchCastByHash(castContext.hash, castContext.fid);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [farcasterLoading, isInMiniApp, castContext]);

  const fetchCastByHash = async (hash: string, fid?: number) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ hash });
      if (fid) params.set("fid", String(fid));
      const res = await fetch(`/api/cast?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCast(data.cast);
      setStep("preview");
    } catch {
      setError(t.castNotFound);
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
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.debug || data?.error || "Unknown error");
      }
      setCast(data.cast);
      setStep("preview");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      setError(`${t.castNotFound}${msg ? ` (${msg})` : ""}`);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t]);

  const resetAll = () => {
    setStep("home");
    setCast(null);
    setDraft(null);
    setError(null);
  };

  if (farcasterLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">{t.loading}</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/10 gap-2">
        <h1
          className="text-lg font-bold cursor-pointer shrink-0"
          onClick={resetAll}
        >
          {t.castToNft}
        </h1>
        <div className="flex items-center gap-2 shrink-0">
          <LanguageSwitcher />
          <WalletButton />
        </div>
      </header>
      <ConnectionStatus />

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
                {t.heroTitle}
              </h2>
              <p className="text-gray-400 text-lg max-w-md mx-auto">
                {t.heroDescription}
              </p>
            </div>

            {isInMiniApp && loading ? (
              <div className="text-gray-400">{t.loadingCast}</div>
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
                message={t.connectWalletPrompt}
              />
            )}
            <CastPreview
              cast={cast}
              onProceed={() => {
                if (!isConnected) {
                  setError(t.connectWalletRequired);
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
        {t.builtOnBase}
      </footer>
    </main>
  );
}
