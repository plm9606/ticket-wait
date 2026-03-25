"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Container } from "@/components/layout/Container";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { useRouter } from "next/navigation";
import { requestNotificationPermission } from "@/lib/fcm";

export default function SettingsPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const handleEnablePush = async () => {
    setPushLoading(true);
    try {
      const success = await requestNotificationPermission();
      setPushEnabled(success);
    } catch {
      // ignore
    } finally {
      setPushLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="pt-8">
        <Container>
          <div className="animate-pulse h-8 w-32 bg-surface-low rounded" />
        </Container>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="pt-8">
        <Container>
          <p className="text-on-surface-variant text-sm">로그인이 필요합니다</p>
        </Container>
      </section>
    );
  }

  return (
    <section className="pt-8 pb-24">
      <Container>
        <h1 className="text-lg font-bold font-[family-name:var(--font-manrope)] mb-6">
          설정
        </h1>

        <div className="space-y-4">
          {/* 계정 정보 */}
          <SurfaceCard>
            <div className="text-xs text-on-surface-variant mb-2">계정</div>
            <div className="text-sm font-medium">{user.nickname}</div>
            {user.email && (
              <div className="text-xs text-on-surface-variant mt-1">{user.email}</div>
            )}
          </SurfaceCard>

          {/* 알림 설정 */}
          <SurfaceCard>
            <div className="text-xs text-on-surface-variant mb-2">알림</div>
            {pushEnabled ? (
              <div className="text-sm text-on-surface-variant">
                푸시 알림이 활성화되었습니다
              </div>
            ) : (
              <button
                onClick={handleEnablePush}
                disabled={pushLoading}
                className="text-sm text-black font-medium"
              >
                {pushLoading ? "설정 중..." : "푸시 알림 허용하기"}
              </button>
            )}
          </SurfaceCard>

          {/* 로그아웃 */}
          <SurfaceCard>
            <button
              onClick={handleLogout}
              className="text-sm text-on-surface-variant"
            >
              로그아웃
            </button>
          </SurfaceCard>
        </div>
      </Container>
    </section>
  );
}
