import cron from "node-cron";
import { syncVenues, syncPerformances } from "../sync/kopis-sync.js";
import { sendTicketOpenReminders } from "../services/notification.service.js";

/**
 * KOPIS 동기화 스케줄러 시작
 * - 매일 새벽 3시 (KST): Venue 동기화 → Performance 동기화
 * - 매일 오전 9시 (KST): 티켓 오픈 리마인더
 */
export function startScheduler() {
  // 매일 새벽 3시 KST (UTC 18:00) — Venue → Performance 순서로 동기화
  cron.schedule("0 18 * * *", async () => {
    console.log("[Scheduler] Starting daily KOPIS sync...");

    console.log("[Scheduler] Syncing venues...");
    await syncVenues();

    console.log("[Scheduler] Syncing performances...");
    await syncPerformances();

    console.log("[Scheduler] Daily sync complete");
  });

  // 매일 오전 9시 KST (UTC 00:00) — 티켓 오픈 리마인더
  cron.schedule("0 0 * * *", async () => {
    console.log("[Scheduler] Sending ticket open reminders...");
    const sent = await sendTicketOpenReminders();
    console.log(`[Scheduler] ${sent} ticket open reminders sent`);
  });

  console.log("[Scheduler] KOPIS sync scheduler started");
}
