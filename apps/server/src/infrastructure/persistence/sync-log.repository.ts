import type { PrismaClient } from "@prisma/client";
import type { ISyncLogRepository, SyncLogEntry } from "../../ports/out/sync-log.port.js";

export class PrismaSyncLogRepository implements ISyncLogRepository {
  constructor(private prisma: PrismaClient) {}

  async create(source: string): Promise<SyncLogEntry> {
    const row = await this.prisma.syncLog.create({
      data: { source, status: "RUNNING" },
    });

    return toEntry(row);
  }

  async findLastSuccess(source: string): Promise<SyncLogEntry | null> {
    const row = await this.prisma.syncLog.findFirst({
      where: { source, status: "SUCCESS" },
      orderBy: { startedAt: "desc" },
    });

    return row ? toEntry(row) : null;
  }

  async markSuccess(
    id: number,
    stats: { itemsFound: number; newItems: number; updatedItems: number }
  ): Promise<void> {
    await this.prisma.syncLog.update({
      where: { id },
      data: {
        status: "SUCCESS",
        completedAt: new Date(),
        itemsFound: stats.itemsFound,
        newItems: stats.newItems,
        updatedItems: stats.updatedItems,
      },
    });
  }

  async markFailed(id: number, error: string): Promise<void> {
    await this.prisma.syncLog.update({
      where: { id },
      data: {
        status: "FAILED",
        completedAt: new Date(),
        errors: error,
      },
    });
  }
}

function toEntry(row: {
  id: number;
  source: string;
  startedAt: Date;
  status: string;
}): SyncLogEntry {
  return {
    id: row.id,
    source: row.source,
    startedAt: row.startedAt,
    status: row.status as SyncLogEntry["status"],
  };
}
