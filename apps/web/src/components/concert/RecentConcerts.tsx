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
}

function sourceLabel(source: string) {
  switch (source) {
    case "INTERPARK": return "인터파크";
    case "YES24": return "YES24";
    case "MELON": return "멜론티켓";
    default: return source;
  }
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

export function RecentConcerts() {
  const [concerts, setConcerts] = useState<Concert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await api<{ items: Concert[] }>("/concerts?limit=8");
        setConcerts(data.items);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-12">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-[3/4] bg-gray-100" />
            <div className="h-2.5 bg-gray-100 rounded mt-5 w-3/4" />
            <div className="h-2 bg-gray-50 rounded mt-2 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (concerts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 text-sm">아직 등록된 공연이 없습니다</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-12">
      {concerts.map((concert) => (
        <Link
          key={concert.id}
          href={`/concerts/${concert.id}`}
          className="group"
        >
          <div className="aspect-[3/4] bg-gray-100 overflow-hidden">
            {concert.imageUrl ? (
              <img
                src={concert.imageUrl}
                alt={concert.title}
                className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300 text-[10px] tracking-[0.2em]">
                NO IMAGE
              </div>
            )}
          </div>
          <div className="mt-5">
            <div className="text-[13px] font-light leading-[1.6] line-clamp-2 text-gray-900">
              {concert.title}
            </div>
            {concert.artist && (
              <div className="text-[11px] font-light text-gray-400 mt-2">
                {concert.artist.name}
              </div>
            )}
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[10px] font-light text-gray-300 tracking-[0.1em]">
                {sourceLabel(concert.source)}
              </span>
              {concert.startDate && (
                <span className="text-[10px] font-light text-gray-300">
                  · {formatDate(concert.startDate)}
                </span>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
