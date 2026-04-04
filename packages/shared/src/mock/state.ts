import { mockArtists, type MockArtist } from "./data/artists";
import { mockPerformances, type MockPerformance } from "./data/concerts";
import {
  mockNotifications,
  type MockNotification,
} from "./data/notifications";
import { mockUser } from "./data/user";

// --- Mutable state ---

let isLoggedIn = true;

const subscribedArtistIds = new Set<number>([
  1,
  2,
  4,
]);

const readNotificationIds = new Set<number>(
  mockNotifications.filter((n) => n.read).map((n) => n.id)
);

// --- Auth ---

export function getUser() {
  if (!isLoggedIn) throw new Error("Not logged in");
  return { ...mockUser };
}

export function logout() {
  isLoggedIn = false;
}

// --- Performances ---

export function getPerformances(
  limit: number,
  cursor: string | null,
  genre: string | null
) {
  let filtered = [...mockPerformances];

  if (genre) {
    filtered = filtered.filter((c) => c.genre === genre);
  }

  // Sort by createdAt desc (newest first)
  filtered.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const startIndex = cursor ? parseInt(cursor, 10) : 0;
  const items = filtered.slice(startIndex, startIndex + limit);
  const nextIndex = startIndex + limit;
  const nextCursor = nextIndex < filtered.length ? String(nextIndex) : null;

  return {
    items: items.map(formatPerformanceListItem),
    nextCursor,
  };
}

export function getPerformanceById(id: number) {
  const performance = mockPerformances.find((c) => c.id === id);
  if (!performance) throw new Error("Performance not found");

  const artist = performance.artistId
    ? mockArtists.find((a) => a.id === performance.artistId)
    : null;

  return {
    id: performance.id,
    title: performance.title,
    venue: performance.venue,
    startDate: performance.startDate,
    endDate: performance.endDate,
    ticketOpenDate: performance.ticketOpenDate,
    source: performance.source,
    sourceUrl: performance.sourceUrl,
    imageUrl: performance.imageUrl,
    genre: performance.genre,
    status: performance.status,
    artist: artist
      ? {
          id: artist.id,
          name: artist.name,
          nameEn: artist.nameEn,
          imageUrl: artist.imageUrl,
          aliases: artist.aliases,
          subscriberCount: artist.subscriberCount,
        }
      : null,
  };
}

function formatPerformanceListItem(c: MockPerformance) {
  return {
    id: c.id,
    title: c.title,
    artist: c.artist,
    venue: c.venue,
    startDate: c.startDate,
    endDate: c.endDate,
    ticketOpenDate: c.ticketOpenDate,
    source: c.source,
    sourceUrl: c.sourceUrl,
    imageUrl: c.imageUrl,
    genre: c.genre,
    status: c.status,
  };
}

// --- Artists ---

export function searchArtists(query: string) {
  if (!query) return [];

  const q = query.toLowerCase();
  return mockArtists
    .filter((a) => {
      if (a.name.toLowerCase().includes(q)) return true;
      if (a.nameEn && a.nameEn.toLowerCase().includes(q)) return true;
      if (a.aliases.some((alias) => alias.toLowerCase().includes(q)))
        return true;
      return false;
    })
    .map(formatArtistSearchItem);
}

export function getArtistById(id: number) {
  const artist = mockArtists.find((a) => a.id === id);
  if (!artist) throw new Error("Artist not found");

  const performances = mockPerformances
    .filter(
      (c) =>
        c.artistId === id &&
        (c.status === "UPCOMING" || c.status === "ON_SALE")
    )
    .map(formatPerformanceListItem);

  return {
    id: artist.id,
    name: artist.name,
    nameEn: artist.nameEn,
    aliases: artist.aliases,
    imageUrl: artist.imageUrl,
    subscriberCount: artist.subscriberCount,
    performances,
  };
}

function formatArtistSearchItem(a: MockArtist) {
  return {
    id: a.id,
    name: a.name,
    nameEn: a.nameEn,
    imageUrl: a.imageUrl,
    subscriberCount: a.subscriberCount,
  };
}

// --- Subscriptions ---

export function getSubscriptions() {
  return [...subscribedArtistIds]
    .map((artistId) => {
      const artist = mockArtists.find((a) => a.id === artistId);
      if (!artist) return null;

      const performanceCount = mockPerformances.filter(
        (c) =>
          c.artistId === artistId &&
          (c.status === "UPCOMING" || c.status === "ON_SALE")
      ).length;

      return {
        id: artistId * 100,
        artistId: artist.id,
        name: artist.name,
        nameEn: artist.nameEn,
        imageUrl: artist.imageUrl,
        performanceCount,
        subscribedAt: "2026-01-15T09:00:00.000Z",
      };
    })
    .filter(Boolean);
}

export function addSubscription(artistId: number) {
  subscribedArtistIds.add(artistId);
  return {
    id: artistId * 100,
    artistId,
    subscribedAt: new Date().toISOString(),
  };
}

export function removeSubscription(artistId: number) {
  subscribedArtistIds.delete(artistId);
  return { success: true };
}

export function checkSubscription(artistId: number) {
  return { subscribed: subscribedArtistIds.has(artistId) };
}

// --- Notifications ---

export function getNotifications(limit: number, cursor: string | null) {
  const sorted = [...mockNotifications].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const startIndex = cursor ? parseInt(cursor, 10) : 0;
  const items = sorted.slice(startIndex, startIndex + limit);
  const nextIndex = startIndex + limit;
  const nextCursor = nextIndex < sorted.length ? String(nextIndex) : null;

  return {
    items: items.map((n) => {
      const performance = mockPerformances.find((c) => c.id === n.performanceId);
      return {
        id: n.id,
        type: n.type,
        performance: performance
          ? {
              id: performance.id,
              title: performance.title,
              source: performance.source,
              sourceUrl: performance.sourceUrl,
              imageUrl: performance.imageUrl,
              artist: performance.artist,
            }
          : null,
        read: readNotificationIds.has(n.id),
        createdAt: n.createdAt,
      };
    }),
    nextCursor,
  };
}

export function markNotificationRead(id: number) {
  readNotificationIds.add(id);
  return { success: true };
}

export function getUnreadCount() {
  const count = mockNotifications.filter(
    (n) => !readNotificationIds.has(n.id)
  ).length;
  return { count };
}
