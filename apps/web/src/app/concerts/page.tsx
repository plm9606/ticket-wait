"use client";

import { useState, useEffect, useCallback } from "react";
import { Container } from "@/components/layout/Container";
import { FilterPill } from "@/components/ui/FilterPill";
import { ConcertCard } from "@/components/concert/ConcertCard";
import { api } from "@/lib/api";
import { GENRE_FILTERS } from "@/lib/format";

interface Concert {
  id: string;
  title: string;
  artist: { id: string; name: string; nameEn: string | null } | null;
  venue: string | null;
  startDate: string | null;
  imageUrl: string | null;
  genre: string;
  status: string;
}

interface ConcertListResponse {
  items: Concert[];
  nextCursor: string | null;
}

export default function ConcertsPage() {
  const [concerts, setConcerts] = useState<Concert[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [genre, setGenre] = useState("");

  const loadConcerts = useCallback(async (nextCursor?: string, genreFilter?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "20" });
      if (nextCursor) params.set("cursor", nextCursor);
      if (genreFilter) params.set("genre", genreFilter);
      const data = await api<ConcertListResponse>(`/concerts?${params}`);
      setConcerts((prev) => nextCursor ? [...prev, ...data.items] : data.items);
      setCursor(data.nextCursor);
      setHasMore(!!data.nextCursor);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setConcerts([]);
    setCursor(null);
    loadConcerts(undefined, genre);
  }, [loadConcerts, genre]);

  return (
    <section className="pt-8 pb-24">
      <Container>
        <h1 className="text-2xl font-bold font-[family-name:var(--font-manrope)] mb-6">
          탐색
        </h1>

        {/* 장르 필터 */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-4 -mx-5 px-5">
          {GENRE_FILTERS.map((g) => (
            <FilterPill
              key={g.value}
              label={g.label}
              active={genre === g.value}
              onClick={() => setGenre(g.value)}
            />
          ))}
        </div>

        {concerts.length === 0 && !loading && (
          <div className="text-center py-16">
            <p className="text-on-surface-variant text-sm">등록된 공연이 없습니다</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          {concerts.map((concert) => (
            <ConcertCard
              key={concert.id}
              concert={concert}
              variant="vertical"
            />
          ))}
        </div>

        {loading && (
          <div className="grid grid-cols-2 gap-4 mt-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse rounded-lg overflow-hidden">
                <div className="aspect-[3/4] bg-surface-low" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-surface-low rounded w-3/4" />
                  <div className="h-3 bg-surface-low rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {hasMore && !loading && (
          <button
            onClick={() => cursor && loadConcerts(cursor, genre)}
            className="w-full mt-6 py-3 text-sm text-on-surface-variant bg-surface-lowest rounded-lg transition-colors"
          >
            더 보기
          </button>
        )}
      </Container>
    </section>
  );
}
