import { mockArtists, type MockArtist } from "./data/artists";
import { mockConcerts, type MockConcert } from "./data/concerts";
import {
  mockNotifications,
  type MockNotification,
} from "./data/notifications";
import { mockUser } from "./data/user";

// --- Mutable state ---

let isLoggedIn = true;

const subscribedArtistIds = new Set<string>([
  "artist-1",
  "artist-2",
  "artist-4",
]);

const readNotificationIds = new Set<string>(
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

// --- Concerts ---

export function getConcerts(
  limit: number,
  cursor: string | null,
  genre: string | null
) {
  let filtered = [...mockConcerts];

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
    items: items.map(formatConcertListItem),
    nextCursor,
  };
}

export function getConcertById(id: string) {
  const concert = mockConcerts.find((c) => c.id === id);
  if (!concert) throw new Error("Concert not found");

  const artist = concert.artistId
    ? mockArtists.find((a) => a.id === concert.artistId)
    : null;

  return {
    id: concert.id,
    title: concert.title,
    venue: concert.venue,
    startDate: concert.startDate,
    endDate: concert.endDate,
    ticketOpenDate: concert.ticketOpenDate,
    source: concert.source,
    sourceUrl: concert.sourceUrl,
    imageUrl: concert.imageUrl,
    genre: concert.genre,
    status: concert.status,
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

function formatConcertListItem(c: MockConcert) {
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

export function getArtistById(id: string) {
  const artist = mockArtists.find((a) => a.id === id);
  if (!artist) throw new Error("Artist not found");

  const concerts = mockConcerts
    .filter(
      (c) =>
        c.artistId === id &&
        (c.status === "UPCOMING" || c.status === "ON_SALE")
    )
    .map(formatConcertListItem);

  return {
    id: artist.id,
    name: artist.name,
    nameEn: artist.nameEn,
    aliases: artist.aliases,
    imageUrl: artist.imageUrl,
    subscriberCount: artist.subscriberCount,
    concerts,
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

      const concertCount = mockConcerts.filter(
        (c) =>
          c.artistId === artistId &&
          (c.status === "UPCOMING" || c.status === "ON_SALE")
      ).length;

      return {
        id: `sub-${artistId}`,
        artistId: artist.id,
        name: artist.name,
        nameEn: artist.nameEn,
        imageUrl: artist.imageUrl,
        concertCount,
        subscribedAt: "2026-01-15T09:00:00.000Z",
      };
    })
    .filter(Boolean);
}

export function addSubscription(artistId: string) {
  subscribedArtistIds.add(artistId);
  return {
    id: `sub-${artistId}`,
    artistId,
    subscribedAt: new Date().toISOString(),
  };
}

export function removeSubscription(artistId: string) {
  subscribedArtistIds.delete(artistId);
  return { success: true };
}

export function checkSubscription(artistId: string) {
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
      const concert = mockConcerts.find((c) => c.id === n.concertId);
      return {
        id: n.id,
        type: n.type,
        concert: concert
          ? {
              id: concert.id,
              title: concert.title,
              source: concert.source,
              sourceUrl: concert.sourceUrl,
              imageUrl: concert.imageUrl,
              artist: concert.artist,
            }
          : null,
        read: readNotificationIds.has(n.id),
        createdAt: n.createdAt,
      };
    }),
    nextCursor,
  };
}

export function markNotificationRead(id: string) {
  readNotificationIds.add(id);
  return { success: true };
}

export function getUnreadCount() {
  const count = mockNotifications.filter(
    (n) => !readNotificationIds.has(n.id)
  ).length;
  return { count };
}
