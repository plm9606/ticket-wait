"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Container } from "@/components/layout/Container";
import { EditorialHeadline } from "@/components/shared/EditorialHeadline";
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
      <section>
        <EditorialHeadline title="Settings" />
        <Container>
          <div className="animate-pulse h-20 bg-surface-container-low rounded-xl" />
        </Container>
      </section>
    );
  }

  if (!user) {
    return (
      <section>
        <EditorialHeadline title="Settings" />
        <Container>
          <p className="text-on-surface-variant text-sm">로그인이 필요합니다</p>
        </Container>
      </section>
    );
  }

  return (
    <section className="pb-24">
      <EditorialHeadline title="Settings" subtitle="환경 설정" />
      <Container>
        <div className="space-y-4">
          {/* 계정 정보 */}
          <div className="bg-surface-container-low p-6 rounded-xl">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-on-surface-variant mb-3">
              계정
            </div>
            <div className="text-sm font-bold text-on-surface">{user.nickname}</div>
            {user.email && (
              <div className="text-xs text-on-surface-variant mt-1">{user.email}</div>
            )}
          </div>

          {/* 알림 설정 */}
          <div className="bg-surface-container-low p-6 rounded-xl">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-on-surface-variant mb-3">
              알림
            </div>
            {pushEnabled ? (
              <div className="bg-surface-container-lowest p-4 rounded-lg text-sm text-on-surface-variant">
                푸시 알림이 활성화되었습니다
              </div>
            ) : (
              <button
                onClick={handleEnablePush}
                disabled={pushLoading}
                className="bg-surface-container-lowest p-4 rounded-lg text-sm font-bold text-primary hover:bg-surface-container transition-colors w-full text-left"
              >
                {pushLoading ? "설정 중..." : "푸시 알림 허용하기"}
              </button>
            )}
          </div>

          {/* 로그아웃 */}
          <div className="pt-4">
            <button
              onClick={handleLogout}
              className="text-sm text-on-surface-variant hover:text-error transition-colors"
            >
              로그아웃
            </button>
          </div>
        </div>
      </Container>
    </section>
  );
}
