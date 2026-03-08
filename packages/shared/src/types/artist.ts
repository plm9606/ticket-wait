export interface Artist {
  id: string;
  name: string;
  nameEn: string | null;
  aliases: string[];
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subscription {
  id: string;
  userId: string;
  artistId: string;
  createdAt: Date;
  artist?: Artist;
}
