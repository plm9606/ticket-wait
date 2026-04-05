import type { CursorPage } from "../../domain/performance.entity.js";
import type { NotificationItem } from "../../domain/notification.entity.js";

export interface INotificationUseCase {
  registerToken(userId: number, token: string, device?: string): Promise<void>;
  history(userId: number, limit?: number, cursor?: number): Promise<CursorPage<NotificationItem>>;
  markRead(id: number, userId: number): Promise<void>;
  unreadCount(userId: number): Promise<number>;
  notifyNewPerformance(performanceId: number): Promise<number>;
  notifyNewPerformances(performanceIds: number[]): Promise<number>;
  sendTicketOpenReminders(): Promise<number>;
}
