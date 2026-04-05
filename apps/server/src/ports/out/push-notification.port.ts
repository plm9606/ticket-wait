export interface PushMessage {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

export interface IPushNotificationService {
  sendPush(token: string, message: PushMessage): Promise<boolean>;
  sendPushBatch(
    tokens: string[],
    message: PushMessage
  ): Promise<{ success: number; failure: number }>;
}
