"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";

interface SubscribedArtist {
  id: string;
  artistId: string;
  name: string;
}

export default function KakaoCallbackPage() {
  const router = useRouter();
  const { fetchUser } = useAuth();

  useEffect(() => {
    fetchUser().then(async () => {
      try {
        const subs = await api<SubscribedArtist[]>("/subscriptions");
        router.replace(subs.length === 0 ? "/onboarding" : "/");
      } catch {
        router.replace("/");
      }
    });
  }, [fetchUser, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-sm text-on-surface-variant">로그인 처리 중...</p>
    </div>
  );
}
