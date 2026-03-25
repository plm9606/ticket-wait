"use client";

import { useState } from "react";
import { Container } from "@/components/layout/Container";
import { SearchBar } from "@/components/home/SearchBar";
import { UpcomingForYou } from "@/components/home/UpcomingForYou";
import { TrendingConcerts } from "@/components/home/TrendingConcerts";
import { FilterPill } from "@/components/ui/FilterPill";
import { GENRE_FILTERS } from "@/lib/format";

export default function HomePage() {
  const [genre, setGenre] = useState("");

  return (
    <section className="pt-4 pb-24">
      <Container>
        <div className="space-y-8">
          <SearchBar />

          {/* 장르 필터 */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-5 px-5">
            {GENRE_FILTERS.map((g) => (
              <FilterPill
                key={g.value}
                label={g.label}
                active={genre === g.value}
                onClick={() => setGenre(g.value)}
              />
            ))}
          </div>

          <UpcomingForYou />
          <TrendingConcerts genre={genre} />
        </div>
      </Container>
    </section>
  );
}
