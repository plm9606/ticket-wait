import type { NotificationType } from "./enums.js";

export interface Notification {
  id: number;
  userId: number;
  performanceId: number;
  type: NotificationType;
  sentAt: Date;
  readAt: Date | null;
}

export interface NotificationItem {
  id: number;
  type: NotificationType;
  read: boolean;
  createdAt: Date;
  performance: {
    id: number;
    title: string;
    source: string;
    sourceUrl: string;
    imageUrl: string | null;
    artists: Array<{ id: number; name: string; nameEn: string | null }>;
  } | null;
}

export interface CreateNotificationInput {
  userId: number;
  performanceId: number;
  type: NotificationType;
}
