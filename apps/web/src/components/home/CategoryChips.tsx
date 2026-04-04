"use client";

const GENRE_FILTERS = [
  { label: "전체", value: "" },
  { label: "콘서트", value: "CONCERT" },
  { label: "페스티벌", value: "FESTIVAL" },
  { label: "팬미팅", value: "FANMEETING" },
  { label: "뮤지컬", value: "MUSICAL" },
  { label: "클래식", value: "CLASSIC" },
  { label: "힙합/R&B", value: "HIPHOP" },
  { label: "트로트", value: "TROT" },
];

interface CategoryChipsProps {
  genre: string;
  onSelect: (genre: string) => void;
}

export function CategoryChips({ genre, onSelect }: CategoryChipsProps) {
  return (
    <section className="pb-10">
      <div className="flex overflow-x-auto no-scrollbar gap-3 px-6">
        {GENRE_FILTERS.map((filter) => {
          const isActive = genre === filter.value;
          return (
            <button
              key={filter.value}
              onClick={() => onSelect(filter.value)}
              className={`flex-shrink-0 px-6 py-2.5 rounded-full font-label text-sm transition-colors ${
                isActive
                  ? "bg-primary text-on-primary font-semibold tracking-wide"
                  : "bg-surface-container-highest text-on-surface font-medium hover:bg-surface-variant"
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}
