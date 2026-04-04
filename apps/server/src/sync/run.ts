import "dotenv/config";
import { syncVenues, syncPerformances } from "./kopis-sync.js";

async function main() {
  console.log("=== KOPIS 동기화 시작 ===\n");

  console.log("[1/2] Venue 동기화...");
  await syncVenues();

  console.log("\n[2/2] Performance 동기화...");
  await syncPerformances();

  console.log("\n=== 동기화 완료 ===");
}

main()
  .catch((e) => {
    console.error("동기화 실패:", e);
    process.exit(1);
  })
  .finally(() => process.exit(0));
