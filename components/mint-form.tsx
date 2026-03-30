"use client";

import { useState, useEffect } from "react";
import type { CastRecord, CardStyle, MintDraft } from "@/lib/types";
import { StyleSelector } from "./style-selector";
import { useI18n } from "@/lib/i18n";

type Props = {
  cast: CastRecord;
  onConfirm: (draft: MintDraft) => void;
  onBack: () => void;
};

export function MintForm({ cast, onConfirm, onBack }: Props) {
  const { t } = useI18n();
  const [style, setStyle] = useState<CardStyle>("midnight");
  const [includeImage, setIncludeImage] = useState(!!cast.embedImageUrl);
  const [mintPriceEth, setMintPriceEth] = useState("0");
  const [royaltyBps, setRoyaltyBps] = useState(250);
  const [initialSupply, setInitialSupply] = useState(1);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPreviewLoading(true);
      fetch("/api/generate-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          castHash: cast.hash,
          style,
          includeImage,
          cast,
        }),
      })
        .then((res) => res.blob())
        .then((blob) => {
          if (previewUrl) URL.revokeObjectURL(previewUrl);
          setPreviewUrl(URL.createObjectURL(blob));
        })
        .catch(() => setPreviewUrl(null))
        .finally(() => setPreviewLoading(false));
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cast.hash, style, includeImage]);

  const handleSubmit = () => {
    onConfirm({
      castHash: cast.hash,
      style,
      includeImage,
      mintPriceEth,
      royaltyBps,
      initialSupply,
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <button onClick={onBack} className="text-sm text-gray-400 hover:text-white">
        {t.back}
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: settings */}
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2">{t.styleLabel}</label>
            <StyleSelector value={style} onChange={setStyle} />
          </div>

          {cast.embedImageUrl && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeImage}
                onChange={(e) => setIncludeImage(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">{t.includeImage}</span>
            </label>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">
              {t.mintPriceLabel}
            </label>
            <input
              type="number"
              step="0.0001"
              min="0"
              value={mintPriceEth}
              onChange={(e) => setMintPriceEth(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {t.royaltyLabel((royaltyBps / 100).toFixed(1))}
            </label>
            <input
              type="range"
              min="0"
              max="1000"
              step="50"
              value={royaltyBps}
              onChange={(e) => setRoyaltyBps(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {t.initialSupplyLabel}
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={initialSupply}
              onChange={(e) =>
                setInitialSupply(
                  Math.min(100, Math.max(1, Number(e.target.value)))
                )
              }
              className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* Right: preview */}
        <div>
          <label className="block text-sm font-medium mb-2">{t.previewLabel}</label>
          <div className="aspect-[1200/630] rounded-lg overflow-hidden bg-white/5 border border-white/10">
            {previewLoading ? (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                {t.generating}
              </div>
            ) : previewUrl ? (
              <img
                src={previewUrl}
                alt="Card preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                {t.previewFailed}
              </div>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={handleSubmit}
        className="w-full py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors"
      >
        {t.toConfirm}
      </button>
    </div>
  );
}
