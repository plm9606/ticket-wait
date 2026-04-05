import type { PrismaClient } from "@prisma/client";
import type { INotificationRepository } from "../../ports/out/notification.port.js";
import type { CreateNotificationInput, Notification, NotificationItem } from "../../domain/notification.entity.js";
import type { CursorPage } from "../../domain/performance.entity.js";

export class PrismaNotificationRepository implements INotificationRepository {
  constructor(private prisma: PrismaClient) {}

  async findHistory(userId: number, limit: number, cursor?: number): Promise<CursorPage<NotificationItem>> {
    const rows = await this.prisma.notification.findMany({
      where: { userId },
      include: {
        performance: {
          select: {
            id: true,
            title: true,
            source: true,
            sourceUrl: true,
            imageUrl: true,
            artist: { select: { id: true, name: true, nameEn: true } },
          },
        },
      },
      orderBy: { sentAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;

    return {
      items: items.map((n) => ({
        id: n.id,
        type: n.type,
        read: !!n.readAt,
        createdAt: n.sentAt,
        performance: n.performance
          ? {
              id: n.performance.id,
              title: n.performance.title,
              source: n.performance.source,
              sourceUrl: n.performance.sourceUrl,
              imageUrl: n.performance.imageUrl,
              artist: n.performance.artist,
            }
          : null,
      })),
      nextCursor: hasMore ? items[items.length - 1].id : null,
    };
  }

  async findOne(id: number, userId: number): Promise<Notification | null> {
    const row = await this.prisma.notification.findFirst({ where: { id, userId } });
    return row ? toNotification(row) : null;
  }

  async countUnread(userId: number): Promise<number> {
    return this.prisma.notification.count({ where: { userId, readAt: null } });
  }

  async markRead(id: number): Promise<void> {
    await this.prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });
  }

  async create(data: CreateNotificationInput): Promise<Notification> {
    const row = await this.prisma.notification.create({
      data: {
        userId: data.userId,
        performanceId: data.performanceId,
        type: data.type,
      },
    });

    return toNotification(row);
  }

  async existsForPerformance(performanceId: number, type: string): Promise<boolean> {
    const row = await this.prisma.notification.findFirst({
      where: { performanceId, type: type as never },
    });
    return !!row;
  }

  async existsForUserPerformance(userId: number, performanceId: number, type: string): Promise<boolean> {
    const row = await this.prisma.notification.findFirst({
      where: { userId, performanceId, type: type as never },
    });
    return !!row;
  }

  async registerToken(userId: number, token: string, device: string): Promise<void> {
    await this.prisma.fcmToken.upsert({
      where: { token },
      update: { userId, device },
      create: { userId, token, device },
    });
  }
}

function toNotification(row: {
  id: number;
  userId: number;
  performanceId: number;
  type: string;
  sentAt: Date;
  readAt: Date | null;
}): Notification {
  return {
    id: row.id,
    userId: row.userId,
    performanceId: row.performanceId,
    type: row.type as Notification["type"],
    sentAt: row.sentAt,
    readAt: row.readAt,
  };
}
