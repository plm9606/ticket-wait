export interface Subscription {
  id: number;
  userId: number;
  artistId: number;
  createdAt: Date;
}

export interface SubscriptionWithArtist {
  id: number;
  artistId: number;
  name: string;
  nameEn: string | null;
  imageUrl: string | null;
  performanceCount: number;
  subscribedAt: Date;
}
