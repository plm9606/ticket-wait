import { API_URL } from "./constants";
import { getToken } from "./auth";

const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === "true";

export async function api<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  if (USE_MOCK) {
    const { mockApi } = await import("@concert-alert/shared");
    return mockApi<T>(path, options);
  }

  const token = await getToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  return res.json();
}
