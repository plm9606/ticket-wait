"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Container } from "@/components/layout/Container";
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
          <div className="animate-pulse h-8 w-32 bg-gray-100 rounded" />
        </Container>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="pt-8">
        <Container>
          <p className="text-gray-400 text-sm">로그인이 필요합니다</p>
        </Container>
      </section>
    );
  }

  return (
    <section className="pt-8">
      <Container>
        <h1 className="text-lg font-bold mb-8">설정</h1>

        <div className="divide-y divide-gray-100">
          {/* 계정 정보 */}
          <div className="py-5">
            <div className="text-xs text-gray-400 mb-2">계정</div>
            <div className="text-sm">{user.nickname}</div>
            {user.email && (
              <div className="text-xs text-gray-400 mt-1">{user.email}</div>
            )}
          </div>

          {/* 알림 설정 */}
          <div className="py-5">
            <div className="text-xs text-gray-400 mb-2">알림</div>
            {pushEnabled ? (
              <div className="text-sm text-gray-500">
                푸시 알림이 활성화되었습니다
              </div>
            ) : (
              <button
                onClick={handleEnablePush}
                disabled={pushLoading}
                className="text-sm text-black font-medium hover:opacity-70 transition-opacity"
              >
                {pushLoading ? "설정 중..." : "푸시 알림 허용하기"}
              </button>
            )}
          </div>

          {/* 로그아웃 */}
          <div className="py-5">
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-black transition-colors"
            >
              로그아웃
            </button>
          </div>
        </div>
      </Container>
    </section>
  );
}
