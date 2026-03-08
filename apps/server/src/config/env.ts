function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function optionalEnv(name: string, fallback: string): string {
  return process.env[name] || fallback;
}

export const env = {
  DATABASE_URL: requireEnv("DATABASE_URL"),
  KAKAO_REST_API_KEY: optionalEnv("KAKAO_REST_API_KEY", ""),
  KAKAO_CLIENT_SECRET: optionalEnv("KAKAO_CLIENT_SECRET", ""),
  KAKAO_REDIRECT_URI: optionalEnv(
    "KAKAO_REDIRECT_URI",
    "http://localhost:3000/auth/kakao/callback"
  ),
  JWT_SECRET: optionalEnv("JWT_SECRET", "dev-secret-key"),
  PORT: Number(optionalEnv("PORT", "4000")),
  FRONTEND_URL: optionalEnv("FRONTEND_URL", "http://localhost:3000"),
  // Firebase (optional - push notifications)
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || "",
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || "",
  FIREBASE_PRIVATE_KEY: (process.env.FIREBASE_PRIVATE_KEY || "").replace(
    /\\n/g,
    "\n"
  ),
};
