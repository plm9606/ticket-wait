import { Badge } from "@/components/ui/Badge";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { timeAgo } from "@/lib/format";

interface NotificationItem {
  id: string;
  type: string;
  concert: {
    id: string;
    title: string;
    source: string;
    sourceUrl: string;
    imageUrl: string | null;
    status?: string;
    startDate?: string | null;
    venue?: string | null;
    artist: { id: string; name: string; nameEn: string | null } | null;
  };
  read: boolean;
  createdAt: string;
}

function typeBadge(type: string) {
  switch (type) {
    case "NEW_CONCERT":
      return { label: "새 공연", variant: "blue" as const };
    case "TICKET_OPEN_SOON":
      return { label: "티켓 오픈", variant: "green" as const };
    default:
      return { label: "알림", variant: "gray" as const };
  }
}

function dateParts(dateStr: string) {
  const d = new Date(dateStr);
  const month = d.toLocaleDateString("ko-KR", { month: "short" });
  const day = d.getDate();
  return { month, day };
}

interface AlertCardProps {
  notification: NotificationItem;
  onRead: () => void;
}

export function AlertCard({ notification: n, onRead }: AlertCardProps) {
  const badge = typeBadge(n.type);
  const date = dateParts(n.createdAt);

  return (
    <a
      href={`/concerts/${n.concert.id}`}
      onClick={onRead}
      className="block"
    >
      <SurfaceCard className={`p-4 ${n.read ? "opacity-60" : ""}`}>
        <div className="flex items-start gap-3">
          {/* 날짜 뱃지 */}
          <div className="shrink-0 w-12 h-12 rounded-lg bg-surface-low flex flex-col items-center justify-center">
            <span className="text-[10px] text-on-surface-variant leading-none">
              {date.month}
            </span>
            <span className="text-lg font-bold leading-tight">{date.day}</span>
          </div>

          {/* 콘텐츠 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant={badge.variant}>{badge.label}</Badge>
              <span className="text-[10px] text-on-surface-variant">
                {timeAgo(n.createdAt)}
              </span>
              {!n.read && (
                <span className="w-1.5 h-1.5 bg-black rounded-full" />
              )}
            </div>
            <div className="text-sm font-medium line-clamp-2 leading-snug">
              {n.concert.title}
            </div>
            <div className="text-xs text-on-surface-variant mt-1">
              {n.concert.artist?.name}
              {n.concert.venue && ` · ${n.concert.venue}`}
            </div>
          </div>

          {/* 이미지 */}
          {n.concert.imageUrl && (
            <div className="w-12 h-16 shrink-0 rounded-lg overflow-hidden bg-surface-low">
              <img
                src={n.concert.imageUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
      </SurfaceCard>
    </a>
  );
}
