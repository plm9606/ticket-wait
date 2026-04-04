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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-[3/4] bg-gray-100 rounded-md" />
            <div className="h-3 bg-gray-100 rounded mt-2 w-3/4" />
            <div className="h-2.5 bg-gray-100 rounded mt-1 w-1/2" />
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
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {concerts.map((concert) => (
        <Link
          key={concert.id}
          href={`/concerts/${concert.id}`}
          className="group"
        >
          <div className="aspect-[3/4] bg-gray-50 rounded-md overflow-hidden">
            {concert.imageUrl ? (
              <img
                src={concert.imageUrl}
                alt={concert.title}
                className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-200 text-xs">
                No Image
              </div>
            )}
          </div>
          <div className="mt-2">
            <div className="text-xs font-medium leading-snug line-clamp-2">
              {concert.title}
            </div>
            {concert.artist && (
              <div className="text-[10px] text-gray-500 mt-0.5">
                {concert.artist.name}
              </div>
            )}
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[10px] text-gray-300">
                {sourceLabel(concert.source)}
              </span>
              {concert.startDate && (
                <span className="text-[10px] text-gray-300">
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
