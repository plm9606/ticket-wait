"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { api } from "@/lib/api";

interface Concert {
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

interface ConcertListResponse {
  items: Concert[];
  nextCursor: string | null;
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
  });
}

function sourceLabel(source: string) {
  switch (source) {
    case "INTERPARK": return "인터파크";
    case "YES24": return "YES24";
    case "MELON": return "멜론티켓";
    default: return source;
  }
}

const GENRE_FILTERS = [
  { value: "", label: "전체" },
  { value: "CONCERT", label: "콘서트" },
  { value: "FESTIVAL", label: "페스티벌" },
  { value: "FANMEETING", label: "팬미팅" },
  { value: "MUSICAL", label: "뮤지컬" },
  { value: "CLASSIC", label: "클래식" },
  { value: "HIPHOP", label: "힙합/R&B" },
  { value: "TROT", label: "트로트" },
  { value: "OTHER", label: "기타" },
] as const;

function genreLabel(genre: string) {
  return GENRE_FILTERS.find((g) => g.value === genre)?.label ?? genre;
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
        <h1 className="text-2xl font-bold mb-6">공연</h1>

        {/* 장르 필터 */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
          {GENRE_FILTERS.map((g) => (
            <button
              key={g.value}
              onClick={() => setGenre(g.value)}
              className={`shrink-0 px-3 py-1.5 text-xs font-medium border transition-colors ${
                genre === g.value
                  ? "bg-black text-white border-black"
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>

        {concerts.length === 0 && !loading && (
          <div className="text-center py-16">
            <p className="text-gray-400 text-sm">등록된 공연이 없습니다</p>
          </div>
        )}

        <div className="space-y-3">
          {concerts.map((concert) => (
            <Link
              key={concert.id}
              href={`/concerts/${concert.id}`}
              className="flex gap-4 p-3 border border-gray-100 hover:border-gray-300 transition-colors"
            >
              {concert.imageUrl && (
                <div className="w-16 h-22 shrink-0 bg-gray-50 overflow-hidden">
                  <img
                    src={concert.imageUrl}
                    alt={concert.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium leading-snug line-clamp-2">
                  {concert.title}
                </div>
                {concert.artist && (
                  <div className="text-xs text-gray-500 mt-1">
                    {concert.artist.name}
                  </div>
                )}
                <div className="flex items-center gap-2 mt-1">
                  {concert.venue && (
                    <span className="text-xs text-gray-400">{concert.venue}</span>
                  )}
                  {concert.startDate && (
                    <span className="text-xs text-gray-400">
                      {formatDate(concert.startDate)}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[10px] text-gray-300">
                    {sourceLabel(concert.source)}
                  </span>
                  {concert.genre && concert.genre !== "CONCERT" && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500">
                      {genreLabel(concert.genre)}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {loading && (
          <div className="space-y-3 mt-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse flex gap-4 p-3">
                <div className="w-16 h-22 bg-gray-100 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {hasMore && !loading && (
          <button
            onClick={() => cursor && loadConcerts(cursor, genre)}
            className="w-full mt-6 py-3 text-sm text-gray-400 hover:text-black border border-gray-100 hover:border-gray-300 transition-colors"
          >
            더 보기
          </button>
        )}
      </Container>
    </section>
  );
}
