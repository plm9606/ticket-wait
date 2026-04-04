import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Concert Alert",
  slug: "concert-alert",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  scheme: "concertalert",
  userInterfaceStyle: "light",
  newArchEnabled: true,
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#000000",
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: "com.concertalert.app",
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#000000",
    },
    package: "com.concertalert.app",
    googleServicesFile: "./google-services.json",
  },
  plugins: [
    "expo-router",
    "expo-secure-store",
    "expo-font",
  ],
  extra: {
    apiUrl: process.env.API_URL || "http://localhost:4000",
    eas: {
      projectId: process.env.EAS_PROJECT_ID || "",
    },
  },
});
