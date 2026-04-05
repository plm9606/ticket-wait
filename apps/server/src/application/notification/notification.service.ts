import type { INotificationRepository } from "../../ports/out/notification.port.js";
import type { IUserRepository } from "../../ports/out/user.port.js";
import type { IPerformanceRepository } from "../../ports/out/performance.port.js";
import type { IPushNotificationService } from "../../ports/out/push-notification.port.js";
import type { INotificationUseCase } from "../../ports/in/notification.use-case.js";
import type { CursorPage } from "../../domain/performance.entity.js";
import type { NotificationItem } from "../../domain/notification.entity.js";

export class NotificationService implements INotificationUseCase {
  constructor(
    private notifications: INotificationRepository,
    private users: IUserRepository,
    private performances: IPerformanceRepository,
    private push: IPushNotificationService
  ) {}

  async registerToken(userId: number, token: string, device = "web"): Promise<void> {
    await this.notifications.registerToken(userId, token, device);
  }

  async history(userId: number, limit = 20, cursor?: number): Promise<CursorPage<NotificationItem>> {
    return this.notifications.findHistory(userId, Math.min(limit, 50), cursor);
  }

  async markRead(id: number, userId: number): Promise<void> {
    const notification = await this.notifications.findOne(id, userId);
    if (!notification) {
      throw Object.assign(new Error("Notification not found"), { statusCode: 404 });
    }
    await this.notifications.markRead(id);
  }

  async unreadCount(userId: number): Promise<number> {
    return this.notifications.countUnread(userId);
  }

  async notifyNewPerformance(performanceId: number): Promise<number> {
    const performance = await this.performances.findById(performanceId);
    if (!performance || !performance.artistId || !performance.artist) return 0;

    const subscribers = await this.users.findSubscribersByArtist(performance.artistId);
    if (subscribers.length === 0) return 0;

    let sentCount = 0;
    for (const user of subscribers) {
      await this.notifications.create({
        userId: user.id,
        performanceId: performance.id,
        type: "NEW_CONCERT",
      });

      const tokens = user.fcmTokens.map((t) => t.token);
      if (tokens.length > 0) {
        const result = await this.push.sendPushBatch(tokens, {
          title: `${performance.artist.name} 새 공연!`,
          body: performance.title,
          imageUrl: performance.imageUrl || undefined,
          data: {
            type: "NEW_CONCERT",
            performanceId: String(performance.id),
            artistId: String(performance.artistId),
            url: `/artist/${performance.artistId}`,
          },
        });
        sentCount += result.success;
      }
    }

    return sentCount;
  }

  async notifyNewPerformances(performanceIds: number[]): Promise<number> {
    let total = 0;
    for (const id of performanceIds) {
      const alreadySent = await this.notifications.existsForPerformance(id, "NEW_CONCERT");
      if (alreadySent) continue;
      const sent = await this.notifyNewPerformance(id);
      total += sent;
    }
    return total;
  }

  async sendTicketOpenReminders(): Promise<number> {
    const performances = await this.performances.findWithTicketOpenToday();
    let sentCount = 0;

    for (const perf of performances) {
      const subscribers = await this.users.findSubscribersByArtist(perf.artistId);

      for (const user of subscribers) {
        const alreadySent = await this.notifications.existsForUserPerformance(
          user.id,
          perf.id,
          "TICKET_OPEN_SOON"
        );
        if (alreadySent) continue;

        await this.notifications.create({
          userId: user.id,
          performanceId: perf.id,
          type: "TICKET_OPEN_SOON",
        });

        const tokens = user.fcmTokens.map((t) => t.token);
        if (tokens.length > 0) {
          const result = await this.push.sendPushBatch(tokens, {
            title: "오늘 티켓 오픈!",
            body: `${perf.artist?.name ?? ""} - ${perf.title}`,
            imageUrl: perf.imageUrl || undefined,
            data: {
              type: "TICKET_OPEN_SOON",
              performanceId: String(perf.id),
              url: perf.sourceUrl,
            },
          });
          sentCount += result.success;
        }
      }
    }

    return sentCount;
  }
}
