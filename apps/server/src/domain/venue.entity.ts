export interface Venue {
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
}

export interface UpsertVenueInput {
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
}
