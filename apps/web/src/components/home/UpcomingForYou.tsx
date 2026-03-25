"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { ConcertCard } from "@/components/concert/ConcertCard";

interface Concert {
  id: string;
  title: string;
  artist: { id: string; name: string; nameEn: string | null } | null;
  venue: string | null;
  startDate: string | null;
  imageUrl: string | null;
  status: string;
}

export function UpcomingForYou() {
  const { user } = useAuth();
  const [concerts, setConcerts] = useState<Concert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const endpoint = user
      ? "/concerts/feed?limit=10"
      : "/concerts?limit=10";

    api<{ items: Concert[] }>(endpoint)
      .then((data) => setConcerts(data.items))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const title = user ? "맞춤 추천" : "지금 주목할 공연";

  if (loading) {
    return (
      <section>
        <h2 className="text-lg font-bold font-[family-name:var(--font-manrope)] mb-4">
          {title}
        </h2>
        <div className="flex gap-4 overflow-hidden">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="shrink-0 w-[260px] rounded-lg bg-surface-low animate-pulse aspect-[16/10]" />
          ))}
        </div>
      </section>
    );
  }

  if (concerts.length === 0) {
    return (
      <section>
        <h2 className="text-lg font-bold font-[family-name:var(--font-manrope)] mb-4">
          {title}
        </h2>
        <div className="bg-surface-lowest rounded-lg p-6 text-center">
          <p className="text-sm text-on-surface-variant">
            아직 등록된 공연이 없습니다
          </p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="text-lg font-bold font-[family-name:var(--font-manrope)] mb-4">
        {title}
      </h2>
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-5 px-5">
        {concerts.map((concert) => (
          <ConcertCard
            key={concert.id}
            concert={concert}
            variant="horizontal"
          />
        ))}
      </div>
    </section>
  );
}
