import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useAuth } from "@/hooks/useAuth";
import { useNotificationCount } from "@/hooks/useNotificationCount";
import { colors } from "@/theme/colors";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { fetchUser, user, loading } = useAuth();
  const { fetch: fetchCount } = useNotificationCount();

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (user) fetchCount();
  }, [user]);

  useEffect(() => {
    if (!loading) {
      SplashScreen.hideAsync();
    }
  }, [loading]);

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.white },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="concerts/[id]"
          options={{ headerShown: true, headerTitle: "", headerBackTitle: "" }}
        />
        <Stack.Screen
          name="artist/[id]"
          options={{ headerShown: true, headerTitle: "", headerBackTitle: "" }}
        />
        <Stack.Screen
          name="my/notifications"
          options={{ headerShown: true, headerTitle: "알림", headerBackTitle: "" }}
        />
        <Stack.Screen
          name="settings"
          options={{ headerShown: true, headerTitle: "설정", headerBackTitle: "" }}
        />
      </Stack>
    </>
  );
}
