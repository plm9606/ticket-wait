import type { ISubscriptionRepository } from "../../ports/out/subscription.port.js";
import type { IArtistRepository } from "../../ports/out/artist.port.js";
import type { ISubscriptionUseCase } from "../../ports/in/subscription.use-case.js";
import type { Subscription, SubscriptionWithArtist } from "../../domain/subscription.entity.js";

export class SubscriptionService implements ISubscriptionUseCase {
  constructor(
    private subscriptions: ISubscriptionRepository,
    private artists: IArtistRepository
  ) {}

  async list(userId: number): Promise<SubscriptionWithArtist[]> {
    return this.subscriptions.findByUser(userId);
  }

  async create(userId: number, artistId: number): Promise<Subscription> {
    const artist = await this.artists.findById(artistId);
    if (!artist) {
      throw Object.assign(new Error("Artist not found"), { statusCode: 404 });
    }

    const existing = await this.subscriptions.find(userId, artistId);
    if (existing) {
      throw Object.assign(new Error("Already subscribed"), { statusCode: 409 });
    }

    return this.subscriptions.create(userId, artistId);
  }

  async remove(userId: number, artistId: number): Promise<void> {
    const subscription = await this.subscriptions.find(userId, artistId);
    if (!subscription) {
      throw Object.assign(new Error("Subscription not found"), { statusCode: 404 });
    }
    await this.subscriptions.delete(subscription.id);
  }

  async check(userId: number, artistId: number): Promise<boolean> {
    const subscription = await this.subscriptions.find(userId, artistId);
    return !!subscription;
  }
}
