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
  KAKAO_REST_API_KEY: requireEnv("KAKAO_REST_API_KEY"),
  KAKAO_CLIENT_SECRET: requireEnv("KAKAO_CLIENT_SECRET"),
  KAKAO_REDIRECT_URI: requireEnv("KAKAO_REDIRECT_URI"),
  JWT_SECRET: requireEnv("JWT_SECRET"),
  PORT: Number(optionalEnv("PORT", "4000")),
  FRONTEND_URL: optionalEnv("FRONTEND_URL", "http://localhost:3000"),
};
