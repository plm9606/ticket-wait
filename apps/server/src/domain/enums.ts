export type TicketSource = "MELON" | "YES24" | "INTERPARK";

export type PerformanceGenre =
  | "CONCERT"
  | "FESTIVAL"
  | "FANMEETING"
  | "MUSICAL"
  | "CLASSIC"
  | "HIPHOP"
  | "TROT"
  | "OTHER";

export type PerformanceStatus =
  | "UPCOMING"
  | "ON_SALE"
  | "SOLD_OUT"
  | "COMPLETED"
  | "CANCELLED";

export type NotificationType = "NEW_CONCERT" | "TICKET_OPEN_SOON";

export type SyncStatus = "RUNNING" | "SUCCESS" | "FAILED";
