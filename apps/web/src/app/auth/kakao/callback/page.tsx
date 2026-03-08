"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function KakaoCallbackPage() {
  const router = useRouter();
  const { fetchUser } = useAuth();

  useEffect(() => {
    // 서버에서 JWT 쿠키를 설정한 후 여기로 리다이렉트됨
    // 유저 정보를 가져오고 /my로 이동
    fetchUser().then(() => {
      router.replace("/my");
    });
  }, [fetchUser, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-sm text-gray-400">로그인 처리 중...</p>
    </div>
  );
}
