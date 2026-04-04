import Link from "next/link";

interface Concert {
  id: string;
  title: string;
  artist?: { id: string; name: string; nameEn: string | null } | null;
  venue: string | null;
  startDate: string | null;
  source: string;
  imageUrl: string | null;
  genre?: string;
}

const SOURCE_LABELS: Record<string, string> = {
  INTERPARK: "인터파크",
  YES24: "YES24",
  MELON: "멜론티켓",
};

const GENRE_LABELS: Record<string, string> = {
  CONCERT: "콘서트",
  FESTIVAL: "페스티벌",
  FANMEETING: "팬미팅",
  MUSICAL: "뮤지컬",
  CLASSIC: "클래식",
  HIPHOP: "힙합/R&B",
  TROT: "트로트",
  OTHER: "기타",
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("ko-KR", { month: "long", day: "numeric" });
}

export function ConcertListCard({ concert }: { concert: Concert }) {
  return (
    <Link
      href={`/concerts/${concert.id}`}
      className="bg-surface-container-lowest p-3 rounded-xl group hover:bg-white transition-colors flex gap-4"
    >
      {concert.imageUrl ? (
        <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-surface-container-low">
          <img
            src={concert.imageUrl}
            alt={concert.title}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-16 h-16 rounded-lg shrink-0 bg-surface-container-low" />
      )}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm tracking-tight text-on-surface line-clamp-2">
          {concert.title}
        </p>
        {concert.artist && (
          <p className="text-xs text-on-surface-variant mt-1">
            {concert.artist.name}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1">
          {concert.venue && (
            <span className="text-xs text-on-surface-variant truncate">
              {concert.venue}
            </span>
          )}
          {concert.startDate && (
            <span className="text-xs text-on-surface-variant">
              {formatDate(concert.startDate)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            {SOURCE_LABELS[concert.source] ?? concert.source}
          </span>
          {concert.genre && concert.genre !== "CONCERT" && (
            <span className="bg-secondary-container text-on-secondary-container rounded-full px-2 py-0.5 text-[10px] font-bold">
              {GENRE_LABELS[concert.genre] ?? concert.genre}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
