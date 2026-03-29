"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isNativeApp, postToNative, onNativeMessage } from "@/lib/native-bridge";
import { api } from "@/lib/api";

export function NativeBridgeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!isNativeApp()) return;

    // hydration 완료 → Native에 READY 신호 전송
    postToNative({ type: "READY" });

    // Native → Web 메시지 리스너
    const cleanup = onNativeMessage(async (msg) => {
      switch (msg.type) {
        case "PUSH_TOKEN":
          try {
            await api("/notifications/register-token", {
              method: "POST",
              body: JSON.stringify({
                token: msg.token,
                device: msg.platform,
              }),
            });
          } catch (err) {
            console.error("[NativeBridge] Failed to register push token:", err);
          }
          break;

        case "NAVIGATE":
          router.push(msg.path);
          break;
      }
    });

    return cleanup;
  }, [router]);

  return <>{children}</>;
}
