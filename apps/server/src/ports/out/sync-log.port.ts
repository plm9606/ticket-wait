import type { SyncStatus } from "../../domain/enums.js";

export interface SyncLogEntry {
  id: number;
  source: string;
  startedAt: Date;
  status: SyncStatus;
}

export interface ISyncLogRepository {
  create(source: string): Promise<SyncLogEntry>;
  findLastSuccess(source: string): Promise<SyncLogEntry | null>;
  markSuccess(id: number, stats: { itemsFound: number; newItems: number; updatedItems: number }): Promise<void>;
  markFailed(id: number, error: string): Promise<void>;
}
