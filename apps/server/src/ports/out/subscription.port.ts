import type { Subscription, SubscriptionWithArtist } from "../../domain/subscription.entity.js";

export interface ISubscriptionRepository {
  findByUser(userId: number): Promise<SubscriptionWithArtist[]>;
  findArtistIds(userId: number): Promise<number[]>;
  find(userId: number, artistId: number): Promise<Subscription | null>;
  create(userId: number, artistId: number): Promise<Subscription>;
  delete(id: number): Promise<void>;
}
