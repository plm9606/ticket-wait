import type { Venue, UpsertVenueInput } from "../../domain/venue.entity.js";

export interface IVenueRepository {
  findByKopisId(kopisId: string): Promise<Venue | null>;
  upsert(data: UpsertVenueInput): Promise<Venue>;
}
