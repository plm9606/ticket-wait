export interface ArtistSearchResult {
  spotifyId: string;
  name: string;
  imageUrl: string | null;
}

export interface ArtistImagePort {
  /**
   * Spotify ID로 아티스트 이미지 URL 조회
   */
  getImageUrl(spotifyId: string): Promise<string | null>;

  /**
   * 아티스트 이름으로 Spotify 검색
   */
  searchArtist(name: string): Promise<ArtistSearchResult[]>;
}
