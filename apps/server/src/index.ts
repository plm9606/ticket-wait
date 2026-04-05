import "dotenv/config";
import { buildApp } from "./app.js";
import { env } from "./config/env.js";
import { startScheduler } from "./crawlers/scheduler.js";

async function main() {
  const { fastify, syncService, notificationService } = await buildApp();
  startScheduler(syncService, notificationService);

  try {
    await fastify.listen({ port: env.PORT, host: "0.0.0.0" });
    console.log(`Server running on http://localhost:${env.PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

main();
