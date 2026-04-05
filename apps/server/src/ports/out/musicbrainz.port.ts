export interface MBAlias {
  name: string;
  locale: string | null;
  type: string | null;
  primary: boolean | null;
  "sort-name": string;
}

export interface MBArtist {
  id: string;
  name: string;
  "sort-name": string;
  type: string | null;
  country: string | null;
  disambiguation: string;
  aliases?: MBAlias[];
  score?: number;
}

export interface MappedArtist {
  musicbrainzId: string;
  /** 한글 이름 */
  name: string;
  /** 영문 이름 */
  nameEn: string | null;
  aliases: string[];
  type: string | null;
}

export interface IMusicBrainzPort {
  fetchAllKoreanArtists(
    type: "group" | "person" | null,
    maxCount?: number
  ): AsyncGenerator<MBArtist[]>;
  getArtistWikidataId(mbid: string): Promise<string | null>;
}
