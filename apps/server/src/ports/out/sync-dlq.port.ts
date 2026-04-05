export interface SyncDlqEntry {
  id: number;
  kopisId: string;
  reason: string;
  rawData: unknown;
  resolvedAt: Date | null;
  resolvedArtistId: number | null;
  createdAt: Date;
}

export interface ISyncDlqRepository {
  upsert(data: { kopisId: string; reason: string; rawData: object }): Promise<void>;
}
