import Link from "next/link";
import { formatDate } from "@/lib/format";

interface ConcertCardConcert {
  id: string;
  title: string;
  artist: { id: string; name: string; nameEn: string | null } | null;
  venue: string | null;
  startDate: string | null;
  imageUrl: string | null;
  status: string;
}

interface ConcertCardProps {
  concert: ConcertCardConcert;
  variant: "horizontal" | "vertical" | "numbered";
  number?: number;
  action?: React.ReactNode;
}

export function ConcertCard({
  concert,
  variant,
  number,
  action,
}: ConcertCardProps) {
  if (variant === "horizontal") {
    return (
      <Link
        href={`/concerts/${concert.id}`}
        className="shrink-0 w-[260px] rounded-lg overflow-hidden bg-surface-lowest"
      >
        <div className="relative aspect-[16/10] bg-surface-low">
          {concert.imageUrl && (
            <img
              src={concert.imageUrl}
              alt={concert.title}
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-3 left-3 right-3 text-white">
            <div className="text-sm font-medium line-clamp-2 leading-snug">
              {concert.title}
            </div>
            <div className="text-xs opacity-80 mt-1">
              {concert.artist?.name}
              {concert.startDate && ` · ${formatDate(concert.startDate)}`}
            </div>
          </div>
        </div>
      </Link>
    );
  }

  if (variant === "numbered") {
    return (
      <div className="flex items-center gap-4 py-4">
        <span className="text-2xl font-bold text-surface-dim w-8 text-center font-[family-name:var(--font-manrope)]">
          {String(number ?? 0).padStart(2, "0")}
        </span>
        <Link
          href={`/concerts/${concert.id}`}
          className="flex items-center gap-3 flex-1 min-w-0"
        >
          {concert.imageUrl && (
            <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-surface-low">
              <img
                src={concert.imageUrl}
                alt={concert.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium line-clamp-2 leading-snug">
              {concert.title}
            </div>
            <div className="text-xs text-on-surface-variant mt-1">
              {concert.venue && <span>{concert.venue}</span>}
              {concert.startDate && <span> · {formatDate(concert.startDate)}</span>}
            </div>
          </div>
        </Link>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    );
  }

  // vertical
  return (
    <Link
      href={`/concerts/${concert.id}`}
      className="block rounded-lg overflow-hidden bg-surface-lowest"
    >
      <div className="relative aspect-[3/4] bg-surface-low">
        {concert.imageUrl && (
          <img
            src={concert.imageUrl}
            alt={concert.title}
            className="w-full h-full object-cover"
          />
        )}
      </div>
      <div className="p-3">
        <div className="text-sm font-medium line-clamp-2 leading-snug">
          {concert.title}
        </div>
        {concert.artist && (
          <div className="text-xs text-on-surface-variant mt-1">
            {concert.artist.name}
          </div>
        )}
        <div className="text-xs text-on-surface-variant mt-1">
          {concert.venue && <span>{concert.venue}</span>}
          {concert.startDate && <span> · {formatDate(concert.startDate)}</span>}
        </div>
      </div>
    </Link>
  );
}
