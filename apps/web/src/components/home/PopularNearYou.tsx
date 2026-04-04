"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

interface Concert {
  id: string;
  title: string;
  artist: { id: string; name: string; nameEn: string | null } | null;
  venue: string | null;
  startDate: string | null;
  source: string;
  sourceUrl: string;
  imageUrl: string | null;
  genre: string;
  status: string;
}

function formatMonth(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("ko-KR", { month: "short" }).replace(".", "");
}

function formatDay(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).getDate().toString().padStart(2, "0");
}

interface PopularNearYouProps {
  genre: string;
}

export function PopularNearYou({ genre }: PopularNearYouProps) {
  const [concerts, setConcerts] = useState<Concert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const genreParam = genre ? `&genre=${genre}` : "";
        const data = await api<{ items: Concert[] }>(
          `/concerts?limit=4${genreParam}`
        );
        setConcerts(data.items);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [genre]);

  return (
    <section className="bg-surface-container-low py-12 px-6">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="font-headline font-extrabold text-3xl tracking-tight leading-none">
            인기 공연
          </h2>
          <p className="text-on-surface-variant font-medium mt-2">
            최근 인기 있는 공연
          </p>
        </div>
        <div className="flex gap-1.5 items-center">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-tertiary" />
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            실시간
          </span>
        </div>
      </div>

      <div className="space-y-10">
        {loading
          ? [...Array(2)].map((_, i) => (
              <div
                key={i}
                className="rounded-3xl overflow-hidden bg-surface-container-lowest animate-pulse"
              >
                <div className="aspect-[16/9] bg-surface-container-low" />
                <div className="p-8 space-y-4">
                  <div className="h-6 bg-surface-container-low rounded w-3/4" />
                  <div className="h-4 bg-surface-container-low rounded w-1/2" />
                </div>
              </div>
            ))
          : concerts.map((concert) => (
              <Link
                key={concert.id}
                href={`/concerts/${concert.id}`}
                className="group block bg-surface-container-lowest rounded-3xl overflow-hidden shadow-sm"
              >
                <div className="aspect-[16/9] overflow-hidden relative">
                  {concert.imageUrl ? (
                    <img
                      src={concert.imageUrl}
                      alt={concert.title}
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary-container to-primary" />
                  )}

                  {concert.startDate && (
                    <div className="absolute top-6 left-6 flex flex-col items-center justify-center w-14 h-16 bg-white/90 backdrop-blur rounded-xl">
                      <span className="text-[10px] font-black uppercase text-on-surface-variant leading-none mb-1">
                        {formatMonth(concert.startDate)}
                      </span>
                      <span className="text-2xl font-black text-primary leading-none">
                        {formatDay(concert.startDate)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-8">
                  <h3 className="font-headline font-bold text-2xl tracking-tight mb-2">
                    {concert.title}
                  </h3>
                  {concert.venue && (
                    <div className="flex items-center gap-2 text-on-surface-variant font-medium">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                      </svg>
                      <span className="text-sm">{concert.venue}</span>
                    </div>
                  )}

                  {concert.artist && (
                    <div className="pt-6 mt-4 border-t border-outline-variant/10 flex items-center gap-4">
                      <span className="text-xs font-semibold text-on-surface-variant">
                        {concert.artist.name}
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
      </div>
    </section>
  );
}
