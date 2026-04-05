import type { CreateNotificationInput, Notification, NotificationItem } from "../../domain/notification.entity.js";
import type { CursorPage } from "../../domain/performance.entity.js";

export interface INotificationRepository {
  findHistory(userId: number, limit: number, cursor?: number): Promise<CursorPage<NotificationItem>>;
  findOne(id: number, userId: number): Promise<Notification | null>;
  countUnread(userId: number): Promise<number>;
  markRead(id: number): Promise<void>;
  create(data: CreateNotificationInput): Promise<Notification>;
  existsForPerformance(performanceId: number, type: string): Promise<boolean>;
  existsForUserPerformance(userId: number, performanceId: number, type: string): Promise<boolean>;
  registerToken(userId: number, token: string, device: string): Promise<void>;
}
