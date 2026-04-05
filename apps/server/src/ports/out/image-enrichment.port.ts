export interface ArtistImageData {
  appleMusicId: number | null;
  imageUrl: string | null;
}

export interface IImageEnrichmentPort {
  fetchImageData(artist: {
    name: string;
    nameEn: string | null;
    aliases: string[];
    musicbrainzId: string | null;
  }): Promise<ArtistImageData>;
}
