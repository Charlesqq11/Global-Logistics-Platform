"use client";

import { languages } from "./LanguageProvider";
import { useLanguage } from "./LanguageProvider";

export default function LanguageSelector() {
  const { language, setLanguage, isReady } = useLanguage();

  return (
    <div className="relative inline-flex items-center">
      <span className="mr-2 text-sm text-slate-400" aria-hidden="true">
        ◎
      </span>

      <select
        aria-label="Select language"
        value={isReady ? language : "en"}
        onChange={(event) =>
          setLanguage(event.target.value as typeof language)
        }
        className="min-w-[125px] cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-3 pr-9 text-xs font-semibold text-slate-700 shadow-sm outline-none transition hover:border-blue-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
      >
        {languages.map((item) => (
          <option key={item.code} value={item.code}>
            {item.native}
          </option>
        ))}
      </select>

      <span className="pointer-events-none absolute right-3 text-[10px] text-slate-400">
        ▼
      </span>
    </div>
  );
}