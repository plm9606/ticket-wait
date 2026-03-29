import admin from "firebase-admin";
import { env } from "../config/env.js";
import { prisma } from "./prisma.js";

let initialized = false;

function getApp(): admin.app.App | null {
  if (!env.FIREBASE_PROJECT_ID || !env.FIREBASE_CLIENT_EMAIL || !env.FIREBASE_PRIVATE_KEY) {
    return null;
  }

  if (!initialized) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: env.FIREBASE_PROJECT_ID,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
        privateKey: env.FIREBASE_PRIVATE_KEY,
      }),
    });
    initialized = true;
  }

  return admin.app();
}

interface PushMessage {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

/**
 * FCM 토큰으로 푸시 메시지 전송
 */
export async function sendPush(token: string, message: PushMessage): Promise<boolean> {
  const app = getApp();
  if (!app) {
    console.warn("[FCM] Firebase not configured, skipping push");
    return false;
  }

  try {
    await admin.messaging().send({
      token,
      notification: {
        title: message.title,
        body: message.body,
        imageUrl: message.imageUrl,
      },
      data: message.data,
      webpush: {
        fcmOptions: {
          link: message.data?.url || "/",
        },
      },
      android: {
        notification: {
          channelId: "concerts",
          sound: "default",
        },
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
            badge: 1,
          },
        },
      },
    });
    return true;
  } catch (err: unknown) {
    const error = err as { code?: string };
    // 만료/무효 토큰 처리
    if (
      error.code === "messaging/registration-token-not-registered" ||
      error.code === "messaging/invalid-registration-token"
    ) {
      console.warn(`[FCM] Removing invalid token: ${token.substring(0, 20)}...`);
      await prisma.fcmToken.delete({ where: { token } }).catch(() => {});
    } else {
      console.error("[FCM] Send error:", err);
    }
    return false;
  }
}

/**
 * 여러 토큰에 동시 전송
 */
export async function sendPushBatch(
  tokens: string[],
  message: PushMessage
): Promise<{ success: number; failure: number }> {
  const app = getApp();
  if (!app || tokens.length === 0) {
    return { success: 0, failure: 0 };
  }

  const results = await Promise.allSettled(
    tokens.map((token) => sendPush(token, message))
  );

  let success = 0;
  let failure = 0;
  for (const result of results) {
    if (result.status === "fulfilled" && result.value) success++;
    else failure++;
  }

  return { success, failure };
}
