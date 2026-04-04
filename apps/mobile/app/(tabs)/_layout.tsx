import { Tabs } from "expo-router";
import { View, Text, StyleSheet } from "react-native";
import { useNotificationCount } from "@/hooks/useNotificationCount";
import { useAuth } from "@/hooks/useAuth";
import { colors } from "@/theme/colors";

function TabIcon({
  icon,
  label,
  focused,
  showBadge,
}: {
  icon: string;
  label: string;
  focused: boolean;
  showBadge?: boolean;
}) {
  return (
    <View style={styles.tabItem}>
      <Text style={[styles.tabIcon, { color: focused ? colors.black : colors.gray[400] }]}>
        {icon}
      </Text>
      <Text
        style={[
          styles.tabLabel,
          { color: focused ? colors.black : colors.gray[400] },
        ]}
      >
        {label}
      </Text>
      {showBadge && <View style={styles.badge} />}
    </View>
  );
}

export default function TabLayout() {
  const { count } = useNotificationCount();
  const { user } = useAuth();
  const showBadge = !!user && count > 0;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="⌂" label="홈" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="◎" label="검색" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="concerts"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="♪" label="공연" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="my"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="♡" label="MY" focused={focused} showBadge={showBadge} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.white,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.gray[100],
    height: 80,
    paddingTop: 8,
  },
  tabItem: {
    alignItems: "center",
    gap: 2,
    position: "relative",
  },
  tabIcon: {
    fontSize: 20,
  },
  tabLabel: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.black,
  },
});
