import { useEffect, useRef, useState } from "react";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";

// 포그라운드 알림 표시 설정
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function usePushNotifications() {
  const [deviceToken, setDeviceToken] = useState<string | null>(null);
  const [pendingNotificationUrl, setPendingNotificationUrl] = useState<string | null>(null);
  const notificationResponseListener = useRef<Notifications.EventSubscription>();

  useEffect(() => {
    // Android 알림 채널 생성
    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("concerts", {
        name: "공연 알림",
        importance: Notifications.AndroidImportance.HIGH,
        sound: "default",
        vibrationPattern: [0, 250, 250, 250],
      });
    }

    // 알림 탭 리스너 — 앱이 실행 중일 때
    notificationResponseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const url = response.notification.request.content.data?.url as
          | string
          | undefined;
        if (url) {
          setPendingNotificationUrl(url);
        }
      });

    // Cold start — 앱이 꺼져있다가 알림 탭으로 시작된 경우
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        const url = response.notification.request.content.data?.url as
          | string
          | undefined;
        if (url) {
          setPendingNotificationUrl(url);
        }
      }
    });

    return () => {
      if (notificationResponseListener.current) {
        Notifications.removeNotificationSubscription(
          notificationResponseListener.current
        );
      }
    };
  }, []);

  /**
   * 디바이스 푸시 토큰 요청 (raw FCM/APNs 토큰)
   */
  async function requestToken(): Promise<string | null> {
    if (!Device.isDevice) {
      console.warn("[Push] Must use a physical device for push notifications");
      return null;
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      return null;
    }

    // raw FCM/APNs 토큰 (Expo push token이 아님)
    const tokenData = await Notifications.getDevicePushTokenAsync();
    const token = tokenData.data;
    setDeviceToken(token);
    return token;
  }

  /**
   * 소비된 pending URL을 클리어
   */
  function consumePendingUrl() {
    setPendingNotificationUrl(null);
  }

  return {
    deviceToken,
    pendingNotificationUrl,
    requestToken,
    consumePendingUrl,
  };
}
