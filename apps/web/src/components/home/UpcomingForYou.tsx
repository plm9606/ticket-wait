"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

interface Performance {
  id: string;
  title: string;
  artist: { id: string; name: string; nameEn: string | null } | null;
  venue: string | null;
  startDate: string | null;
  source: string;
  sourceUrl: string;
  imageUrl: string | null;
  status: string;
  genre: string;
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

function statusLabel(status: string): string | null {
  switch (status) {
    case "ON_SALE":
      return "판매중";
    case "SOLD_OUT":
      return "매진";
    default:
      return null;
  }
}

interface UpcomingForYouProps {
  genre: string;
}

export function UpcomingForYou({ genre }: UpcomingForYouProps) {
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const genreParam = genre ? `&genre=${genre}` : "";
        const data = await api<{ items: Performance[] }>(
          `/performances?limit=10${genreParam}`
        );
        setPerformances(data.items);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [genre]);

  return (
    <section className="mb-12">
      <div className="flex justify-between items-end px-6 mb-6">
        <div>
          <h2 className="font-headline font-extrabold text-3xl tracking-tight leading-none">
            나를 위한 공연
          </h2>
          <p className="text-on-surface-variant font-medium mt-2">
            최근 등록된 공연
          </p>
        </div>
        <Link
          href="/concerts"
          className="text-xs font-bold uppercase tracking-widest text-primary hover:opacity-70 transition-opacity"
        >
          전체 보기
        </Link>
      </div>

      <div className="flex overflow-x-auto no-scrollbar gap-6 px-6">
        {loading
          ? [...Array(3)].map((_, i) => (
              <div key={i} className="flex-shrink-0 w-[280px]">
                <div className="aspect-[4/5] rounded-2xl bg-surface-container-low animate-pulse" />
              </div>
            ))
          : performances.length === 0
            ? (
              <div className="w-full text-center py-12">
                <p className="text-on-surface-variant text-sm">공연이 없습니다</p>
              </div>
            )
            : performances.map((performance) => (
                <Link
                  key={performance.id}
                  href={`/concerts/${performance.id}`}
                  className="flex-shrink-0 w-[280px] group"
                >
                  <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-surface-container-low mb-4">
                    {performance.imageUrl ? (
                      <img
                        src={performance.imageUrl}
                        alt={performance.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary-container to-primary flex items-center justify-center p-6">
                        <span className="text-white/80 font-headline font-bold text-lg text-center leading-tight">
                          {performance.title}
                        </span>
                      </div>
                    )}

                    {statusLabel(performance.status) && (
                      <div className="absolute top-4 left-4">
                        <span className="bg-primary/90 text-white text-[10px] font-bold px-3 py-1 rounded-full backdrop-blur-md uppercase tracking-tight">
                          {statusLabel(performance.status)}
                        </span>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                    <div className="absolute bottom-4 left-4 right-4">
                      <p className="text-white/80 text-xs font-semibold mb-1 uppercase tracking-wider">
                        {formatDate(performance.startDate)}
                        {performance.venue && ` · ${performance.venue}`}
                      </p>
                      <h3 className="text-white font-headline font-bold text-xl leading-tight line-clamp-2">
                        {performance.title}
                      </h3>
                    </div>
                  </div>
                </Link>
              ))}
      </div>
    </section>
  );
}
