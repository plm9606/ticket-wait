import {
  getUser,
  logout,
  getPerformances,
  getPerformanceById,
  searchArtists,
  getArtistById,
  getSubscriptions,
  addSubscription,
  removeSubscription,
  checkSubscription,
  getNotifications,
  markNotificationRead,
  getUnreadCount,
} from "./state.js";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomDelay(): Promise<void> {
  return delay(50 + Math.random() * 100);
}

export async function mockApi<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  await randomDelay();

  const [pathname, queryString] = path.split("?");
  const params = new URLSearchParams(queryString || "");
  const method = options?.method?.toUpperCase() || "GET";

  // --- Auth ---
  if (pathname === "/auth/me" && method === "GET") {
    return getUser() as T;
  }

  if (pathname === "/auth/logout" && method === "POST") {
    logout();
    return { ok: true } as T;
  }

  // --- Performances ---
  if (pathname === "/performances" && method === "GET") {
    const limit = parseInt(params.get("limit") || "20", 10);
    const cursor = params.get("cursor") || null;
    const genre = params.get("genre") || null;
    return getPerformances(limit, cursor, genre) as T;
  }

  const performanceDetailMatch = pathname.match(/^\/performances\/([^/]+)$/);
  if (performanceDetailMatch && method === "GET") {
    return getPerformanceById(Number(performanceDetailMatch[1])) as T;
  }

  // --- Artists ---
  if (pathname === "/artists/search" && method === "GET") {
    const q = params.get("q") || "";
    return searchArtists(q) as T;
  }

  const artistDetailMatch = pathname.match(/^\/artists\/([^/]+)$/);
  if (artistDetailMatch && method === "GET") {
    return getArtistById(Number(artistDetailMatch[1])) as T;
  }

  // --- Subscriptions ---
  if (pathname === "/subscriptions" && method === "GET") {
    return getSubscriptions() as T;
  }

  if (pathname === "/subscriptions" && method === "POST") {
    const body = options?.body ? JSON.parse(options.body as string) : {};
    return addSubscription(Number(body.artistId)) as T;
  }

  const unsubscribeMatch = pathname.match(/^\/subscriptions\/([^/]+)$/);
  if (unsubscribeMatch && method === "DELETE") {
    return removeSubscription(Number(unsubscribeMatch[1])) as T;
  }

  const checkSubMatch = pathname.match(
    /^\/subscriptions\/check\/([^/]+)$/
  );
  if (checkSubMatch && method === "GET") {
    return checkSubscription(Number(checkSubMatch[1])) as T;
  }

  // --- Notifications ---
  if (pathname === "/notifications/unread-count" && method === "GET") {
    return getUnreadCount() as T;
  }

  if (pathname === "/notifications/history" && method === "GET") {
    const limit = parseInt(params.get("limit") || "20", 10);
    const cursor = params.get("cursor") || null;
    return getNotifications(limit, cursor) as T;
  }

  const readNotifMatch = pathname.match(/^\/notifications\/([^/]+)\/read$/);
  if (readNotifMatch && method === "PATCH") {
    return markNotificationRead(Number(readNotifMatch[1])) as T;
  }

  if (pathname === "/notifications/register-token" && method === "POST") {
    return { success: true } as T;
  }

  // --- Fallback ---
  console.warn(`[Mock API] Unhandled: ${method} ${path}`);
  throw new Error(`Mock API: unhandled route ${method} ${path}`);
}
