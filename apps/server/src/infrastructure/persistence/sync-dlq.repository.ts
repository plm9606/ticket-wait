import type { PrismaClient } from "@prisma/client";
import type { ISyncDlqRepository } from "../../ports/out/sync-dlq.port.js";

export class PrismaSyncDlqRepository implements ISyncDlqRepository {
  constructor(private prisma: PrismaClient) {}

  async upsert(data: { kopisId: string; reason: string; rawData: object }): Promise<void> {
    await this.prisma.syncDlq.upsert({
      where: { kopisId: data.kopisId },
      create: {
        kopisId: data.kopisId,
        reason: data.reason,
        rawData: data.rawData,
        resolvedAt: null,
        resolvedArtistId: null,
      },
      update: {
        reason: data.reason,
        rawData: data.rawData,
        resolvedAt: null,
        resolvedArtistId: null,
      },
    });
  }
}
