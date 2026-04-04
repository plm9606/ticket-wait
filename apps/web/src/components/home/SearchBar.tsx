"use client";

import { useRouter } from "next/navigation";

export function SearchBar() {
  const router = useRouter();

  return (
    <section className="px-6 pt-8 pb-6">
      <div
        className="relative group cursor-pointer"
        onClick={() => router.push("/search")}
      >
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-on-surface-variant"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </div>
        <div className="w-full bg-surface-container-lowest h-14 pl-12 pr-6 rounded-xl shadow-sm flex items-center">
          <span className="text-on-surface-variant/50 font-medium">
            아티스트, 공연장을 검색하세요
          </span>
        </div>
      </div>
    </section>
  );
}
