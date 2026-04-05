import type { Subscription, SubscriptionWithArtist } from "../../domain/subscription.entity.js";

export interface ISubscriptionUseCase {
  list(userId: number): Promise<SubscriptionWithArtist[]>;
  create(userId: number, artistId: number): Promise<Subscription>;
  remove(userId: number, artistId: number): Promise<void>;
  check(userId: number, artistId: number): Promise<boolean>;
}
