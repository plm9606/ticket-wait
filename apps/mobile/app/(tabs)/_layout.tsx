import { Tabs } from "expo-router";
import { View, StyleSheet, Platform } from "react-native";
import { useNotificationCount } from "@/hooks/useNotificationCount";
import { useAuth } from "@/hooks/useAuth";
import { colors } from "@/theme/colors";
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
  const { count } = useNotificationCount();
  const { user } = useAuth();
  const showBadge = !!user && count > 0;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.white,
        tabBarInactiveTintColor: colors.gray[400],
        tabBarActiveBackgroundColor: colors.gray[900],
        tabBarItemStyle: styles.tabItem,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIconStyle: styles.tabIcon,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: "홈",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          tabBarLabel: "검색",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="concerts"
        options={{
          tabBarLabel: "공연",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="musical-notes" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="my"
        options={{
          tabBarLabel: "MY",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="heart" size={size} color={color} />
          ),
          tabBarBadge: showBadge ? "" : undefined,
          tabBarBadgeStyle: showBadge ? styles.badge : undefined,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    backgroundColor: "rgba(255,255,255,0.9)",
    borderTopWidth: 0,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    height: 80,
    paddingTop: 4,
    paddingBottom: Platform.OS === "ios" ? 24 : 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.04,
    shadowRadius: 24,
    elevation: 8,
  },
  tabItem: {
    borderRadius: 12,
    marginHorizontal: 4,
    marginVertical: 4,
  },
  tabLabel: {
    fontFamily: "Manrope-Medium",
    fontSize: 10,
    letterSpacing: 1,
    textTransform: "uppercase" as const,
  },
  tabIcon: {
    marginBottom: -2,
  },
  badge: {
    backgroundColor: colors.gray[900],
    minWidth: 6,
    maxHeight: 6,
    borderRadius: 3,
    fontSize: 0,
  },
});
