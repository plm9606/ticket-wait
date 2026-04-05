export interface EnrichResult {
  processed: number;
  enriched: number;
}

export interface IEnrichArtistUseCase {
  enrichOne(artistId: number): Promise<void>;
  enrichAll(): Promise<EnrichResult>;
}
