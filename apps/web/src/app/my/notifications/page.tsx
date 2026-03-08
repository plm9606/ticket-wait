"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";

interface NotificationItem {
  id: string;
  type: string;
  concert: {
    id: string;
    title: string;
    source: string;
    sourceUrl: string;
    imageUrl: string | null;
    artist: { id: string; name: string; nameEn: string | null } | null;
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

  const markAsRead = async (id: string) => {
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
    <section className="pt-8 pb-24">
      <Container>
        <h1 className="text-xl font-bold mb-6">알림</h1>

        {notifications.length === 0 && !loading && (
          <div className="text-center py-16">
            <p className="text-gray-400 text-sm mb-4">아직 알림이 없습니다</p>
            <Link
              href="/search"
              className="text-sm text-black underline underline-offset-4"
            >
              아티스트를 구독해보세요
            </Link>
          </div>
        )}

        <div className="divide-y divide-gray-100">
          {notifications.map((n) => (
            <a
              key={n.id}
              href={n.concert.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => !n.read && markAsRead(n.id)}
              className={`flex gap-3 py-4 transition-colors ${
                n.read ? "opacity-60" : ""
              }`}
            >
              {!n.read && (
                <div className="w-1.5 h-1.5 bg-black rounded-full mt-2 shrink-0" />
              )}
              <div className={`flex-1 min-w-0 ${n.read ? "ml-3" : ""}`}>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-medium px-1.5 py-0.5 bg-gray-100 text-gray-500">
                    {typeLabel(n.type)}
                  </span>
                  <span className="text-[10px] text-gray-300">
                    {timeAgo(n.createdAt)}
                  </span>
                </div>
                <div className="text-sm font-medium leading-snug line-clamp-2">
                  {n.concert.title}
                </div>
                {n.concert.artist && (
                  <div className="text-xs text-gray-400 mt-0.5">
                    {n.concert.artist.name}
                  </div>
                )}
              </div>
              {n.concert.imageUrl && (
                <div className="w-12 h-16 shrink-0 bg-gray-50 overflow-hidden rounded-sm">
                  <img
                    src={n.concert.imageUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </a>
          ))}
        </div>

        {loading && (
          <div className="space-y-4 mt-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse h-16 bg-gray-100 rounded" />
            ))}
          </div>
        )}

        {hasMore && !loading && (
          <button
            onClick={() => cursor && load(cursor)}
            className="w-full mt-4 py-3 text-sm text-gray-400 hover:text-black border border-gray-100 hover:border-gray-300 transition-colors"
          >
            더 보기
          </button>
        )}
      </Container>
    </section>
  );
}
