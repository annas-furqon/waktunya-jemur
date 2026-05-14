"use client";

import { Coffee } from "lucide-react";

interface CoffeeButtonProps {
  isDark: boolean;
}

export function CoffeeButton({ isDark }: CoffeeButtonProps) {
  return (
    <a
      href="https://www.buymeacoffee.com"
      target="_blank"
      rel="noopener noreferrer"
      className={`group flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold shadow-lg transition-all hover:scale-105 hover:shadow-xl active:scale-95 ${
        isDark
          ? "bg-[#FFE082] text-[#3E2723] hover:bg-[#FFD54F]"
          : "bg-[#FF6B6B] text-white hover:bg-[#FF5252]"
      }`}
      aria-label="Buy me a coffee"
    >
      <Coffee className="h-4 w-4 transition-transform group-hover:rotate-12" />
      <span className="hidden sm:inline">Traktir Kopi</span>
      <span className="sm:hidden">Kopi</span>
    </a>
  );
}
