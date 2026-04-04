"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { EditorialHeadline } from "@/components/shared/EditorialHeadline";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";

interface NotificationItem {
  id: number;
  type: string;
  performance: {
    id: number;
    title: string;
    source: string;
    sourceUrl: string;
    imageUrl: string | null;
    artist: { id: number; name: string; nameEn: string | null } | null;
  };
  read: boolean;
  createdAt: string;
}

interface NotificationResponse {
  items: NotificationItem[];
  nextCursor: string | null;
}

function typeLabel(type: string) {
  switch (type) {
    case "NEW_CONCERT": return "새 공연";
    case "TICKET_OPEN_SOON": return "티켓 오픈";
    default: return "알림";
  }
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return new Date(dateStr).toLocaleDateString("ko-KR");
}

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const load = useCallback(async (nextCursor?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "20" });
      if (nextCursor) params.set("cursor", nextCursor);
      const data = await api<NotificationResponse>(`/notifications/history?${params}`);
      setNotifications((prev) => nextCursor ? [...prev, ...data.items] : data.items);
      setCursor(data.nextCursor);
      setHasMore(!!data.nextCursor);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  const markAsRead = async (id: number) => {
    await api(`/notifications/${id}/read`, { method: "PATCH" });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  if (authLoading) {
    return (
      <section className="pt-8">
        <Container>
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-32 bg-gray-100 rounded" />
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded" />
            ))}
          </div>
        </Container>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="pt-16">
        <Container>
          <div className="text-center py-16">
            <p className="text-gray-400 text-sm">로그인이 필요합니다</p>
          </div>
        </Container>
      </section>
    );
  }

  return (
    <section className="pb-24">
      <EditorialHeadline title="Alerts" subtitle="놓치지 않는 알림" />
      <Container>
        {notifications.length === 0 && !loading && (
          <div className="text-center py-16 bg-surface-container-low rounded-xl">
            <p className="text-on-surface-variant text-sm mb-4">아직 알림이 없습니다</p>
            <Link
              href="/search"
              className="text-sm font-bold text-primary underline underline-offset-4"
            >
              아티스트를 구독해보세요
            </Link>
          </div>
        )}

        <div className="space-y-3">
          {notifications.map((n) => (
            <a
              key={n.id}
              href={n.performance.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => !n.read && markAsRead(n.id)}
              className={`flex gap-4 p-5 bg-surface-container-low rounded-2xl hover:bg-surface-container-high transition-colors ${
                n.read ? "opacity-60" : ""
              }`}
            >
              {n.performance.imageUrl && (
                <div className="w-14 h-14 shrink-0 bg-surface-container rounded-xl overflow-hidden">
                  <img
                    src={n.performance.imageUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-secondary-container text-on-secondary-container rounded-full px-2 py-0.5 text-[10px] font-bold uppercase">
                    {typeLabel(n.type)}
                  </span>
                  <span className="text-[10px] text-outline">
                    {timeAgo(n.createdAt)}
                  </span>
                </div>
                <div className="text-sm font-bold tracking-tight text-on-surface leading-snug line-clamp-2">
                  {n.performance.title}
                </div>
                {n.performance.artist && (
                  <div className="text-xs text-on-surface-variant mt-0.5">
                    {n.performance.artist.name}
                  </div>
                )}
              </div>
              {!n.read && (
                <div className="w-2 h-2 bg-primary rounded-full mt-2 shrink-0" />
              )}
            </a>
          ))}
        </div>

        {loading && (
          <div className="space-y-3 mt-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse h-20 bg-surface-container-low rounded-2xl" />
            ))}
          </div>
        )}

        {hasMore && !loading && (
          <button
            onClick={() => cursor && load(cursor)}
            className="w-full mt-6 py-3.5 text-sm font-medium text-on-surface-variant bg-surface-container-high rounded-xl hover:bg-surface-variant transition-colors"
          >
            더 보기
          </button>
        )}
      </Container>
    </section>
  );
}
