"use client";

import { useState, useEffect } from "react";
import { Container } from "@/components/layout/Container";
import { AvatarCircle } from "@/components/ui/AvatarCircle";
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
    <section className="pt-8 pb-16">
      <Container>
        {/* 검색 입력 */}
        <div className="mb-10">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="아티스트 이름을 검색하세요"
            className="w-full text-xl font-[family-name:var(--font-manrope)] font-medium bg-surface-lowest rounded-lg px-4 py-3.5 outline-none placeholder:text-on-surface-variant/40 focus:ring-2 focus:ring-black"
            autoFocus
          />
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

        <div className="space-y-2">
          {results.map((artist) => (
            <a
              key={artist.id}
              href={`/artist/${artist.id}`}
              className="flex items-center gap-4 py-3 px-2 rounded-lg hover:bg-surface-lowest transition-colors"
            >
              <AvatarCircle
                src={artist.imageUrl}
                name={artist.name}
                size="md"
              />
              <div>
                <div className="font-medium text-sm">{artist.name}</div>
                {artist.nameEn && (
                  <div className="text-xs text-on-surface-variant mt-0.5">
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
