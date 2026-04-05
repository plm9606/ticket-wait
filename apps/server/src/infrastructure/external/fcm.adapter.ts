import admin from "firebase-admin";
import { env } from "../../config/env.js";
import type { IPushNotificationService, PushMessage } from "../../ports/out/push-notification.port.js";

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

export class FcmAdapter implements IPushNotificationService {
  async sendPush(token: string, message: PushMessage): Promise<boolean> {
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
      });
      return true;
    } catch (err: unknown) {
      const error = err as { code?: string };
      if (
        error.code === "messaging/registration-token-not-registered" ||
        error.code === "messaging/invalid-registration-token"
      ) {
        console.warn(`[FCM] Invalid token, should remove: ${token.substring(0, 20)}...`);
      } else {
        console.error("[FCM] Send error:", err);
      }
      return false;
    }
  }

  async sendPushBatch(
    tokens: string[],
    message: PushMessage
  ): Promise<{ success: number; failure: number }> {
    const app = getApp();
    if (!app || tokens.length === 0) {
      return { success: 0, failure: 0 };
    }

    const results = await Promise.allSettled(
      tokens.map((token) => this.sendPush(token, message))
    );

    let success = 0;
    let failure = 0;
    for (const result of results) {
      if (result.status === "fulfilled" && result.value) success++;
      else failure++;
    }

    return { success, failure };
  }
}
