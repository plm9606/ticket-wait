"use client";

import { useState } from "react";
import { SearchBar } from "@/components/home/SearchBar";
import { CategoryChips } from "@/components/home/CategoryChips";
import { UpcomingForYou } from "@/components/home/UpcomingForYou";
import { PopularNearYou } from "@/components/home/PopularNearYou";

export default function HomePage() {
  const [genre, setGenre] = useState("");

  return (
    <div className="pb-32">
      <SearchBar />
      <CategoryChips genre={genre} onSelect={setGenre} />
      <UpcomingForYou genre={genre} />
      <PopularNearYou genre={genre} />

      {/* Artist Pulse Dot */}
      <div className="fixed right-6 bottom-28 z-40 md:hidden">
        <div className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-tertiary" />
        </div>
      </div>
    </div>
  );
}
