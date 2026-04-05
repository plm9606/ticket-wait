import type { PrismaClient } from "@prisma/client";
import type { ISyncLogRepository, SyncCheckpoint, SyncLogEntry } from "../../ports/out/sync-log.port.js";

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

  async findLastFailed(source: string): Promise<SyncLogEntry | null> {
    const row = await this.prisma.syncLog.findFirst({
      where: { source, status: "FAILED", checkpoint: { not: null } },
      orderBy: { startedAt: "desc" },
    });

    return row ? toEntry(row) : null;
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

  async saveCheckpoint(id: number, checkpoint: SyncCheckpoint): Promise<void> {
    await this.prisma.syncLog.update({
      where: { id },
      data: { checkpoint: JSON.stringify(checkpoint) },
    });
  }
}

function toEntry(row: {
  id: number;
  source: string;
  startedAt: Date;
  status: string;
  checkpoint: string | null;
}): SyncLogEntry {
  return {
    id: row.id,
    source: row.source,
    startedAt: row.startedAt,
    status: row.status as SyncLogEntry["status"],
    checkpoint: row.checkpoint ? (JSON.parse(row.checkpoint) as SyncCheckpoint) : null,
  };
}
