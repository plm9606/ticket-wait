export type NotificationType = "NEW_CONCERT" | "TICKET_OPEN_SOON";

export interface Notification {
  id: string;
  userId: string;
  performanceId: string;
  type: NotificationType;
  sentAt: Date;
  readAt: Date | null;
}
