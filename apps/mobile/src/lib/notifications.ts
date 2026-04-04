import { Platform } from "react-native";
import { api } from "./api";

let Notifications: typeof import("expo-notifications") | null = null;

try {
  Notifications = require("expo-notifications");
  Notifications?.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
} catch {
  // expo-notifications not available in Expo Go (SDK 53+)
}

export async function registerForPushNotifications(): Promise<boolean> {
  if (!Notifications) return false;

  const { status: existingStatus } =
    await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    return false;
  }

  const tokenData = await Notifications.getDevicePushTokenAsync();

  await api("/notifications/register-token", {
    method: "POST",
    body: JSON.stringify({
      token: tokenData.data,
      device: Platform.OS,
    }),
  });

  return true;
}
