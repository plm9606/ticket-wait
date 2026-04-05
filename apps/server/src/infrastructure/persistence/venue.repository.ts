import type { PrismaClient } from "@prisma/client";
import type { IVenueRepository } from "../../ports/out/venue.port.js";
import type { UpsertVenueInput, Venue } from "../../domain/venue.entity.js";

export class PrismaVenueRepository implements IVenueRepository {
  constructor(private prisma: PrismaClient) {}

  async findByKopisId(kopisId: string): Promise<Venue | null> {
    const row = await this.prisma.venue.findUnique({ where: { kopisId } });
    return row ? toVenue(row) : null;
  }

  async upsert(data: UpsertVenueInput): Promise<Venue> {
    const existing = await this.prisma.venue.findUnique({
      where: { kopisId: data.kopisId },
    });

    if (existing) {
      const updated = await this.prisma.venue.update({
        where: { id: existing.id },
        data: {
          name: data.name,
          address: data.address,
          lat: data.lat,
          lng: data.lng,
          seatScale: data.seatScale,
          phone: data.phone,
          website: data.website,
          sido: data.sido,
          gugun: data.gugun,
        },
      });
      return toVenue(updated);
    }

    const created = await this.prisma.venue.create({ data });
    return toVenue(created);
  }
}

function toVenue(row: {
  id: number;
  name: string;
  kopisId: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  seatScale: number | null;
  phone: string | null;
  website: string | null;
  sido: string | null;
  gugun: string | null;
}): Venue {
  return {
    id: row.id,
    name: row.name,
    kopisId: row.kopisId,
    address: row.address,
    lat: row.lat,
    lng: row.lng,
    seatScale: row.seatScale,
    phone: row.phone,
    website: row.website,
    sido: row.sido,
    gugun: row.gugun,
  };
}
