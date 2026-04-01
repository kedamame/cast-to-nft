"use client";

import type { CastRecord } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";

type Props = {
  cast: CastRecord;
  onProceed: () => void;
  onBack?: () => void;
};

export function CastPreview({ cast, onProceed, onBack }: Props) {
  const { t } = useI18n();

  return (
    <div className="w-full max-w-xl mx-auto space-y-2">
      {onBack && (
        <button onClick={onBack} className="text-sm text-gray-400 hover:text-white">
          {t.back}
        </button>
      )}
    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        {cast.authorPfpUrl && (
          <img
            src={cast.authorPfpUrl}
            alt={cast.authorUsername}
            className="w-12 h-12 rounded-full"
          />
        )}
        <div>
          <p className="font-bold text-lg">@{cast.authorUsername}</p>
          <p className="text-sm text-gray-400">{formatDate(cast.publishedAt)}</p>
        </div>
      </div>

      <p className="text-lg mb-4 whitespace-pre-wrap">{cast.text}</p>

      {cast.embedImageUrl && (
        <img
          src={cast.embedImageUrl}
          alt="Cast embed"
          className="w-full rounded-lg mb-4 max-h-64 object-cover"
        />
      )}

      <div className="flex items-center justify-between pt-4 border-t border-white/10">
        <a
          href={cast.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-purple-400 hover:text-purple-300"
        >
          {t.viewOnWarpcast}
        </a>
        <button
          onClick={onProceed}
          className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors"
        >
          {t.makeNft}
        </button>
      </div>
    </div>
    </div>
  );
}
