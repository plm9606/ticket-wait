"use client";

import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export function SearchBar() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push("/search")}
      className="w-full flex items-center gap-3 bg-surface-lowest rounded-lg px-4 py-3.5 text-left"
    >
      <Search size={18} className="text-on-surface-variant shrink-0" />
      <span className="text-sm text-on-surface-variant">
        아티스트, 공연, 장소 검색…
      </span>
    </button>
  );
}
