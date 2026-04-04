export type NotificationType = "NEW_CONCERT" | "TICKET_OPEN_SOON";

export interface Notification {
  id: number;
  userId: number;
  performanceId: number;
  type: NotificationType;
  sentAt: Date;
  readAt: Date | null;
}
