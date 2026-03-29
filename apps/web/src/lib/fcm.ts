import { api } from "./api";
import { isNativeApp, postToNative } from "./native-bridge";

/**
 * FCM 토큰을 서버에 등록
 */
async function registerToken(token: string) {
  await api("/notifications/register-token", {
    method: "POST",
    body: JSON.stringify({ token, device: "web" }),
  });
}

/**
 * 브라우저 푸시 알림 권한 요청 + FCM 토큰 등록
 */
export async function requestNotificationPermission(): Promise<boolean> {
  // 네이티브 앱에서는 브릿지를 통해 네이티브 푸시 토큰 요청
  if (isNativeApp()) {
    postToNative({ type: "REQUEST_PUSH_TOKEN" });
    return true;
  }

  if (!("Notification" in window)) {
    console.warn("This browser does not support notifications");
    return false;
  }

  if (!("serviceWorker" in navigator)) {
    console.warn("Service Worker not supported");
    return false;
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return false;
  }

  try {
    // Service Worker 등록
    const registration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js"
    );

    // Firebase 동적 임포트 (환경변수 사용)
    const { initializeApp } = await import("firebase/app");
    const { getMessaging, getToken } = await import("firebase/messaging");

    const app = initializeApp({
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    });

    const messaging = getMessaging(app);
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    if (token) {
      await registerToken(token);
      return true;
    }
  } catch (err) {
    console.error("FCM registration failed:", err);
  }

  return false;
}
