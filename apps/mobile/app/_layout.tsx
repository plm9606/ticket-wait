import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from "@expo-google-fonts/manrope";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { useAuth } from "@/hooks/useAuth";
import { useNotificationCount } from "@/hooks/useNotificationCount";
import { colors } from "@/theme/colors";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { fetchUser, user, loading } = useAuth();
  const { fetch: fetchCount } = useNotificationCount();

  const [fontsLoaded] = useFonts({
    Manrope: Manrope_400Regular,
    "Manrope-Medium": Manrope_500Medium,
    "Manrope-SemiBold": Manrope_600SemiBold,
    "Manrope-Bold": Manrope_700Bold,
    "Manrope-ExtraBold": Manrope_800ExtraBold,
    Inter: Inter_400Regular,
    "Inter-Medium": Inter_500Medium,
    "Inter-SemiBold": Inter_600SemiBold,
    "Inter-Bold": Inter_700Bold,
  });

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (user) fetchCount();
  }, [user]);

  useEffect(() => {
    if (!loading && fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [loading, fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.surface },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="concerts/[id]"
          options={{
            headerShown: true,
            headerTitle: "",
            headerBackTitle: "",
            headerTransparent: true,
            headerTintColor: "#fff",
          }}
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
