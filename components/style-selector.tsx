"use client";

import type { CardStyle } from "@/lib/types";

type Props = {
  value: CardStyle;
  onChange: (style: CardStyle) => void;
};

const STYLES: { id: CardStyle; label: string; preview: string }[] = [
  { id: "midnight", label: "Midnight", preview: "bg-[#0f0f23] border-purple-500" },
  { id: "paper", label: "Paper", preview: "bg-[#faf8f5] border-amber-600" },
  { id: "neon", label: "Neon", preview: "bg-black border-green-400" },
  { id: "minimal", label: "Minimal", preview: "bg-white border-blue-500" },
];

export function StyleSelector({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {STYLES.map((s) => (
        <button
          key={s.id}
          onClick={() => onChange(s.id)}
          className={`p-4 rounded-lg border-2 transition-all ${s.preview} ${
            value === s.id
              ? "ring-2 ring-purple-400 scale-[1.02]"
              : "opacity-70 hover:opacity-100"
          }`}
        >
          <span className={s.id === "paper" || s.id === "minimal" ? "text-gray-800" : "text-white"}>
            {s.label}
          </span>
        </button>
      ))}
    </div>
  );
}
