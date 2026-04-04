export interface MockNotification {
  id: number;
  type: "NEW_CONCERT" | "TICKET_OPEN_SOON";
  performanceId: number;
  read: boolean;
  createdAt: string;
}

export const mockNotifications: MockNotification[] = [
  // Unread (5개)
  {
    id: 1,
    type: "NEW_CONCERT",
    performanceId: 1,
    read: false,
    createdAt: "2026-04-03T14:00:00.000Z",
  },
  {
    id: 2,
    type: "TICKET_OPEN_SOON",
    performanceId: 9,
    read: false,
    createdAt: "2026-04-03T10:00:00.000Z",
  },
  {
    id: 3,
    type: "NEW_CONCERT",
    performanceId: 7,
    read: false,
    createdAt: "2026-04-02T18:00:00.000Z",
  },
  {
    id: 4,
    type: "TICKET_OPEN_SOON",
    performanceId: 11,
    read: false,
    createdAt: "2026-04-02T12:00:00.000Z",
  },
  {
    id: 5,
    type: "NEW_CONCERT",
    performanceId: 17,
    read: false,
    createdAt: "2026-04-02T09:00:00.000Z",
  },

  // Read (10개)
  {
    id: 6,
    type: "NEW_CONCERT",
    performanceId: 3,
    read: true,
    createdAt: "2026-04-01T16:00:00.000Z",
  },
  {
    id: 7,
    type: "TICKET_OPEN_SOON",
    performanceId: 5,
    read: true,
    createdAt: "2026-04-01T10:00:00.000Z",
  },
  {
    id: 8,
    type: "NEW_CONCERT",
    performanceId: 13,
    read: true,
    createdAt: "2026-03-31T15:00:00.000Z",
  },
  {
    id: 9,
    type: "NEW_CONCERT",
    performanceId: 19,
    read: true,
    createdAt: "2026-03-31T10:00:00.000Z",
  },
  {
    id: 10,
    type: "TICKET_OPEN_SOON",
    performanceId: 4,
    read: true,
    createdAt: "2026-03-30T18:00:00.000Z",
  },
  {
    id: 11,
    type: "NEW_CONCERT",
    performanceId: 15,
    read: true,
    createdAt: "2026-03-30T11:00:00.000Z",
  },
  {
    id: 12,
    type: "NEW_CONCERT",
    performanceId: 28,
    read: true,
    createdAt: "2026-03-29T14:00:00.000Z",
  },
  {
    id: 13,
    type: "TICKET_OPEN_SOON",
    performanceId: 20,
    read: true,
    createdAt: "2026-03-29T09:00:00.000Z",
  },
  {
    id: 14,
    type: "NEW_CONCERT",
    performanceId: 12,
    read: true,
    createdAt: "2026-03-28T16:00:00.000Z",
  },
  {
    id: 15,
    type: "NEW_CONCERT",
    performanceId: 30,
    read: true,
    createdAt: "2026-03-28T10:00:00.000Z",
  },
];
