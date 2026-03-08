import { prisma } from "../lib/prisma.js";
import { sendPushBatch } from "../lib/fcm.js";

/**
 * 새로 매칭된 공연에 대해 구독자에게 알림 발송
 */
export async function notifyNewConcert(concertId: string): Promise<number> {
  const concert = await prisma.concert.findUnique({
    where: { id: concertId },
    include: { artist: true },
  });

  if (!concert || !concert.artistId || !concert.artist) return 0;

  // 해당 아티스트 구독자 조회
  const subscriptions = await prisma.subscription.findMany({
    where: { artistId: concert.artistId },
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
        concertId: concert.id,
        type: "NEW_CONCERT",
      },
    });

    // FCM 토큰으로 푸시 발송
    const tokens = sub.user.fcmTokens.map((t) => t.token);
    if (tokens.length > 0) {
      const result = await sendPushBatch(tokens, {
        title: `${concert.artist.name} 새 공연!`,
        body: concert.title,
        imageUrl: concert.imageUrl || undefined,
        data: {
          type: "NEW_CONCERT",
          concertId: concert.id,
          artistId: concert.artistId,
          url: `/artist/${concert.artistId}`,
        },
      });
      sentCount += result.success;
    }
  }

  return sentCount;
}

/**
 * 크롤러에서 새로 발견된 공연들에 대해 알림 발송
 * (매칭된 공연 중 아직 알림이 안 간 것들)
 */
export async function notifyNewConcerts(concertIds: string[]): Promise<number> {
  let total = 0;
  for (const id of concertIds) {
    // 이미 알림이 간 공연인지 확인
    const existing = await prisma.notification.findFirst({
      where: { concertId: id, type: "NEW_CONCERT" },
    });
    if (existing) continue;

    const sent = await notifyNewConcert(id);
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

  const concerts = await prisma.concert.findMany({
    where: {
      ticketOpenDate: { gte: today, lt: tomorrow },
      artistId: { not: null },
    },
    include: { artist: true },
  });

  let sentCount = 0;
  for (const concert of concerts) {
    if (!concert.artistId || !concert.artist) continue;

    const subscriptions = await prisma.subscription.findMany({
      where: { artistId: concert.artistId },
      include: {
        user: { include: { fcmTokens: true } },
      },
    });

    for (const sub of subscriptions) {
      // 중복 리마인더 방지
      const existing = await prisma.notification.findFirst({
        where: {
          userId: sub.userId,
          concertId: concert.id,
          type: "TICKET_OPEN_SOON",
        },
      });
      if (existing) continue;

      await prisma.notification.create({
        data: {
          userId: sub.userId,
          concertId: concert.id,
          type: "TICKET_OPEN_SOON",
        },
      });

      const tokens = sub.user.fcmTokens.map((t) => t.token);
      if (tokens.length > 0) {
        const result = await sendPushBatch(tokens, {
          title: `오늘 티켓 오픈!`,
          body: `${concert.artist.name} - ${concert.title}`,
          imageUrl: concert.imageUrl || undefined,
          data: {
            type: "TICKET_OPEN_SOON",
            concertId: concert.id,
            url: concert.sourceUrl,
          },
        });
        sentCount += result.success;
      }
    }
  }

  return sentCount;
}
