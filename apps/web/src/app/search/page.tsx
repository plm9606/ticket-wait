"use client";

import { useState, useEffect } from "react";
import { Container } from "@/components/layout/Container";
import { EditorialHeadline } from "@/components/shared/EditorialHeadline";
import { api } from "@/lib/api";

interface Artist {
  id: string;
  name: string;
  nameEn: string | null;
  imageUrl: string | null;
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api<Artist[]>(
          `/artists/search?q=${encodeURIComponent(query)}`
        );
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <section className="pb-16">
      <EditorialHeadline title="Search" subtitle="아티스트를 찾아보세요" />
      <Container>
        {/* 검색 입력 */}
        <div className="mb-10">
          <div className="relative">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="아티스트 이름을 검색하세요"
              className="w-full bg-surface-container-lowest h-14 rounded-xl pl-12 pr-4 text-base font-medium outline-none placeholder:text-outline shadow-sm focus:ring-0 border-none"
              autoFocus
            />
          </div>
        </div>

        {/* 검색 결과 */}
        {loading && (
          <div className="text-sm text-on-surface-variant">검색 중...</div>
        )}

        {!loading && query && results.length === 0 && (
          <div className="text-center py-16">
            <p className="text-on-surface-variant text-sm">
              검색 결과가 없습니다
            </p>
          </div>
        )}

        <div className="grid grid-cols-3 sm:grid-cols-4 gap-x-6 gap-y-10">
          {results.map((artist) => (
            <a
              key={artist.id}
              href={`/artist/${artist.id}`}
              className="flex flex-col items-center gap-3 group"
            >
              <div className="w-20 h-20 rounded-full bg-surface-container-low overflow-hidden shrink-0 group-hover:scale-95 transition-transform duration-300">
                {artist.imageUrl ? (
                  <img
                    src={artist.imageUrl}
                    alt={artist.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-on-surface-variant text-sm">
                    {artist.name[0]}
                  </div>
                )}
              </div>
              <div className="text-center">
                <div className="font-headline font-bold text-sm text-primary">
                  {artist.name}
                </div>
                {artist.nameEn && (
                  <div className="text-[10px] uppercase tracking-widest text-on-surface-variant mt-1">
                    {artist.nameEn}
                  </div>
                )}
              </div>
            </a>
          ))}
        </div>
      </Container>
    </section>
  );
}
