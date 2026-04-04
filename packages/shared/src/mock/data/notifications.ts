export interface MockNotification {
  id: string;
  type: "NEW_CONCERT" | "TICKET_OPEN_SOON";
  performanceId: string;
  read: boolean;
  createdAt: string;
}

export const mockNotifications: MockNotification[] = [
  // Unread (5개)
  {
    id: "notif-1",
    type: "NEW_CONCERT",
    performanceId: "performance-1",
    read: false,
    createdAt: "2026-04-03T14:00:00.000Z",
  },
  {
    id: "notif-2",
    type: "TICKET_OPEN_SOON",
    performanceId: "performance-9",
    read: false,
    createdAt: "2026-04-03T10:00:00.000Z",
  },
  {
    id: "notif-3",
    type: "NEW_CONCERT",
    performanceId: "performance-7",
    read: false,
    createdAt: "2026-04-02T18:00:00.000Z",
  },
  {
    id: "notif-4",
    type: "TICKET_OPEN_SOON",
    performanceId: "performance-11",
    read: false,
    createdAt: "2026-04-02T12:00:00.000Z",
  },
  {
    id: "notif-5",
    type: "NEW_CONCERT",
    performanceId: "performance-17",
    read: false,
    createdAt: "2026-04-02T09:00:00.000Z",
  },

  // Read (10개)
  {
    id: "notif-6",
    type: "NEW_CONCERT",
    performanceId: "performance-3",
    read: true,
    createdAt: "2026-04-01T16:00:00.000Z",
  },
  {
    id: "notif-7",
    type: "TICKET_OPEN_SOON",
    performanceId: "performance-5",
    read: true,
    createdAt: "2026-04-01T10:00:00.000Z",
  },
  {
    id: "notif-8",
    type: "NEW_CONCERT",
    performanceId: "performance-13",
    read: true,
    createdAt: "2026-03-31T15:00:00.000Z",
  },
  {
    id: "notif-9",
    type: "NEW_CONCERT",
    performanceId: "performance-19",
    read: true,
    createdAt: "2026-03-31T10:00:00.000Z",
  },
  {
    id: "notif-10",
    type: "TICKET_OPEN_SOON",
    performanceId: "performance-4",
    read: true,
    createdAt: "2026-03-30T18:00:00.000Z",
  },
  {
    id: "notif-11",
    type: "NEW_CONCERT",
    performanceId: "performance-15",
    read: true,
    createdAt: "2026-03-30T11:00:00.000Z",
  },
  {
    id: "notif-12",
    type: "NEW_CONCERT",
    performanceId: "performance-28",
    read: true,
    createdAt: "2026-03-29T14:00:00.000Z",
  },
  {
    id: "notif-13",
    type: "TICKET_OPEN_SOON",
    performanceId: "performance-20",
    read: true,
    createdAt: "2026-03-29T09:00:00.000Z",
  },
  {
    id: "notif-14",
    type: "NEW_CONCERT",
    performanceId: "performance-12",
    read: true,
    createdAt: "2026-03-28T16:00:00.000Z",
  },
  {
    id: "notif-15",
    type: "NEW_CONCERT",
    performanceId: "performance-30",
    read: true,
    createdAt: "2026-03-28T10:00:00.000Z",
  },
];
