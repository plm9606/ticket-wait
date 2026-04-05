function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function optionalEnv(name: string, fallback: string): string {
  return process.env[name] || fallback;
}

function buildDatabaseUrl(): string {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const user = optionalEnv("DATABASE_USER", "postgres");
  const password = optionalEnv("DATABASE_PASSWORD", "postgres");
  const host = optionalEnv("DATABASE_HOST", "localhost");
  const port = optionalEnv("DATABASE_PORT", "5432");
  const db = optionalEnv("DATABASE_NAME", "concert_alert");
  return `postgresql://${user}:${password}@${host}:${port}/${db}`;
}

export const env = {
  DATABASE_URL: buildDatabaseUrl(),
  KAKAO_REST_API_KEY: optionalEnv("KAKAO_REST_API_KEY", ""),
  KAKAO_CLIENT_SECRET: optionalEnv("KAKAO_CLIENT_SECRET", ""),
  KAKAO_REDIRECT_URI: optionalEnv("KAKAO_REDIRECT_URI", ""),
  JWT_SECRET: requireEnv("JWT_SECRET"),
  PORT: Number(optionalEnv("PORT", "4000")),
  FRONTEND_URL: optionalEnv("FRONTEND_URL", "http://localhost:3000"),
  KAKAO_REDIRECT_URI_MOBILE: requireEnv("KAKAO_REDIRECT_URI_MOBILE"),
  KOPIS_KEY: optionalEnv("KOPIS_KEY", ""),
  // Firebase (optional - push notifications)
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || "",
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || "",
  FIREBASE_PRIVATE_KEY: (process.env.FIREBASE_PRIVATE_KEY || "").replace(
    /\\n/g,
    "\n"
  ),
};
