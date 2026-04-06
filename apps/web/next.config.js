import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
try {
  process.loadEnvFile(path.resolve(__dirname, "../../.env.web"));
} catch {}

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@concert-alert/shared"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.melon.com" },
      { protocol: "https", hostname: "**.yes24.com" },
      { protocol: "https", hostname: "**.interpark.com" },
      { protocol: "https", hostname: "k.kakaocdn.net" },
    ],
  },
};

export default nextConfig;
