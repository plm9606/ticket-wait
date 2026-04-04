"use client";

import { useState, useEffect, useCallback } from "react";
import { Container } from "@/components/layout/Container";
import { EditorialHeadline } from "@/components/shared/EditorialHeadline";
import { CategoryChips } from "@/components/home/CategoryChips";
import { PerformanceListCard } from "@/components/shared/PerformanceListCard";
import { api } from "@/lib/api";

interface Performance {
  id: string;
  title: string;
  artist: { id: string; name: string; nameEn: string | null } | null;
  venue: string | null;
  startDate: string | null;
  endDate: string | null;
  source: string;
  sourceUrl: string;
  imageUrl: string | null;
  genre: string;
  status: string;
}

interface PerformanceListResponse {
  items: Performance[];
  nextCursor: string | null;
}

export default function ConcertsPage() {
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [genre, setGenre] = useState("");

  const loadPerformances = useCallback(async (nextCursor?: string, genreFilter?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "20" });
      if (nextCursor) params.set("cursor", nextCursor);
      if (genreFilter) params.set("genre", genreFilter);
      const data = await api<PerformanceListResponse>(`/performances?${params}`);
      setPerformances((prev) => nextCursor ? [...prev, ...data.items] : data.items);
      setCursor(data.nextCursor);
      setHasMore(!!data.nextCursor);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setPerformances([]);
    setCursor(null);
    loadPerformances(undefined, genre);
  }, [loadPerformances, genre]);

  return (
    <section className="pb-24">
      <EditorialHeadline title="Concerts" subtitle="오늘의 공연 라인업" />

      <CategoryChips genre={genre} onSelect={setGenre} />

      <Container>
        {performances.length === 0 && !loading && (
          <div className="text-center py-16">
            <p className="text-on-surface-variant text-sm">등록된 공연이 없습니다</p>
          </div>
        )}

        <div className="space-y-3">
          {performances.map((performance) => (
            <PerformanceListCard key={performance.id} performance={performance} />
          ))}
        </div>

        {loading && (
          <div className="space-y-3 mt-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse flex gap-4 p-3 bg-surface-container-low rounded-xl">
                <div className="w-16 h-16 bg-surface-container rounded-lg shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-surface-container rounded w-3/4" />
                  <div className="h-3 bg-surface-container rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {hasMore && !loading && (
          <button
            onClick={() => cursor && loadPerformances(cursor, genre)}
            className="w-full mt-6 py-3.5 text-sm font-medium text-on-surface-variant bg-surface-container-high rounded-xl hover:bg-surface-variant transition-colors"
          >
            더 보기
          </button>
        )}
      </Container>
    </section>
  );
}
