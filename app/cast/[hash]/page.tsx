"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAccount } from "wagmi";
import { CastPreview } from "@/components/cast-preview";
import { MintForm } from "@/components/mint-form";
import { MintButton } from "@/components/mint-button";
import { WalletButton } from "@/components/wallet-button";
import { StatusBanner } from "@/components/status-banner";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useI18n } from "@/lib/i18n";
import type { CastRecord, MintDraft } from "@/lib/types";

type Step = "loading" | "preview" | "setup" | "confirm";

export default function CastPage() {
  const params = useParams();
  const hash = params.hash as string;
  const { isConnected } = useAccount();
  const { t } = useI18n();

  const [step, setStep] = useState<Step>("loading");
  const [cast, setCast] = useState<CastRecord | null>(null);
  const [draft, setDraft] = useState<MintDraft | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!hash) return;
    fetch(`/api/cast?hash=${encodeURIComponent(hash)}`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        setCast(data.cast);
        setStep("preview");
      })
      .catch(() => {
        setError(t.castNotFound);
        setStep("preview");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hash]);

  return (
    <main className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <a href="/" className="text-xl font-bold">
          {t.castToNft}
        </a>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <WalletButton />
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        {error && <StatusBanner type="error" message={error} />}

        {step === "loading" && (
          <p className="text-gray-400">{t.loading}</p>
        )}

        {step === "preview" && cast && (
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
        )}

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

        {step === "confirm" && cast && draft && (
          <MintButton
            draft={draft}
            castUrl={cast.url}
            castAuthor={cast.authorUsername}
            onBack={() => setStep("setup")}
          />
        )}
      </div>
    </main>
  );
}
