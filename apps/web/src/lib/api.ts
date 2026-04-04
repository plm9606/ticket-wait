const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

export async function api<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  if (USE_MOCK) {
    const { mockApi } = await import("@concert-alert/shared");
    return mockApi<T>(path, options);
  }

  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  return res.json();
}
