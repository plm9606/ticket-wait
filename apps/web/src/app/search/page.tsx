"use client";

import { useState, useEffect } from "react";
import { Container } from "@/components/layout/Container";
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
            className="w-full text-2xl md:text-3xl font-light border-b-2 border-black pb-3 outline-none placeholder:text-gray-300 bg-transparent"
            autoFocus
          />
        </div>

        {/* 검색 결과 */}
        {loading && (
          <div className="text-sm text-gray-400">검색 중...</div>
        )}

        {!loading && query && results.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-400 text-sm">
              검색 결과가 없습니다
            </p>
          </div>
        )}

        <div className="divide-y divide-gray-100">
          {results.map((artist) => (
            <a
              key={artist.id}
              href={`/artist/${artist.id}`}
              className="flex items-center gap-4 py-4 hover:opacity-70 transition-opacity"
            >
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-sm shrink-0">
                {artist.imageUrl ? (
                  <img
                    src={artist.imageUrl}
                    alt={artist.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  artist.name[0]
                )}
              </div>
              <div>
                <div className="font-medium text-sm">{artist.name}</div>
                {artist.nameEn && (
                  <div className="text-xs text-gray-400 mt-0.5">
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
