import { prisma } from "../lib/prisma.js";
import { sendPushBatch } from "../lib/fcm.js";

/**
 * 새로 매칭된 공연에 대해 구독자에게 알림 발송
 */
export async function notifyNewPerformance(performanceId: string): Promise<number> {
  const performance = await prisma.performance.findUnique({
    where: { id: performanceId },
    include: { artist: true },
  });

  if (!performance || !performance.artistId || !performance.artist) return 0;

  // 해당 아티스트 구독자 조회
  const subscriptions = await prisma.subscription.findMany({
    where: { artistId: performance.artistId },
    include: {
      user: {
        include: {
          fcmTokens: true,
        },
      },
    },
  });

  if (subscriptions.length === 0) return 0;

  // 각 구독자에게 알림 생성 + 푸시 발송
  let sentCount = 0;
  for (const sub of subscriptions) {
    // DB에 알림 레코드 생성
    await prisma.notification.create({
      data: {
        userId: sub.userId,
        performanceId: performance.id,
        type: "NEW_CONCERT",
      },
    });

    // FCM 토큰으로 푸시 발송
    const tokens = sub.user.fcmTokens.map((t) => t.token);
    if (tokens.length > 0) {
      const result = await sendPushBatch(tokens, {
        title: `${performance.artist.name} 새 공연!`,
        body: performance.title,
        imageUrl: performance.imageUrl || undefined,
        data: {
          type: "NEW_CONCERT",
          performanceId: performance.id,
          artistId: performance.artistId,
          url: `/artist/${performance.artistId}`,
        },
      });
      sentCount += result.success;
    }
  }

  return sentCount;
}

/**
 * 새로 발견된 공연들에 대해 알림 발송
 * (매칭된 공연 중 아직 알림이 안 간 것들)
 */
export async function notifyNewPerformances(performanceIds: string[]): Promise<number> {
  let total = 0;
  for (const id of performanceIds) {
    // 이미 알림이 간 공연인지 확인
    const existing = await prisma.notification.findFirst({
      where: { performanceId: id, type: "NEW_CONCERT" },
    });
    if (existing) continue;

    const sent = await notifyNewPerformance(id);
    total += sent;
  }
  return total;
}

/**
 * 오늘 티켓 오픈 예정인 공연 리마인더 발송
 */
export async function sendTicketOpenReminders(): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const performances = await prisma.performance.findMany({
    where: {
      ticketOpenDate: { gte: today, lt: tomorrow },
      artistId: { not: null },
    },
    include: { artist: true },
  });

  let sentCount = 0;
  for (const perf of performances) {
    if (!perf.artistId || !perf.artist) continue;

    const subscriptions = await prisma.subscription.findMany({
      where: { artistId: perf.artistId },
      include: {
        user: { include: { fcmTokens: true } },
      },
    });

    for (const sub of subscriptions) {
      // 중복 리마인더 방지
      const existing = await prisma.notification.findFirst({
        where: {
          userId: sub.userId,
          performanceId: perf.id,
          type: "TICKET_OPEN_SOON",
        },
      });
      if (existing) continue;

      await prisma.notification.create({
        data: {
          userId: sub.userId,
          performanceId: perf.id,
          type: "TICKET_OPEN_SOON",
        },
      });

      const tokens = sub.user.fcmTokens.map((t) => t.token);
      if (tokens.length > 0) {
        const result = await sendPushBatch(tokens, {
          title: `오늘 티켓 오픈!`,
          body: `${perf.artist.name} - ${perf.title}`,
          imageUrl: perf.imageUrl || undefined,
          data: {
            type: "TICKET_OPEN_SOON",
            performanceId: perf.id,
            url: perf.sourceUrl,
          },
        });
        sentCount += result.success;
      }
    }
  }

  return sentCount;
}
