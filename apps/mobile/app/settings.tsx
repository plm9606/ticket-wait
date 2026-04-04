import { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/Skeleton";
import { colors } from "@/theme/colors";
import { containerPadding } from "@/theme/spacing";

export default function SettingsScreen() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.replace("/");
  };

  const handleEnablePush = async () => {
    setPushLoading(true);
    try {
      const { registerForPushNotifications } = await import("@/lib/notifications");
      const success = await registerForPushNotifications();
      setPushEnabled(success);
    } catch {
      // ignore
    } finally {
      setPushLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Skeleton width={128} height={32} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>로그인이 필요합니다</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 계정 */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>계정</Text>
        <Text style={styles.sectionValue}>{user.nickname}</Text>
        {user.email && (
          <Text style={styles.sectionSub}>{user.email}</Text>
        )}
      </View>

      <View style={styles.divider} />

      {/* 알림 */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>알림</Text>
        {pushEnabled ? (
          <Text style={styles.pushEnabled}>
            푸시 알림이 활성화되었습니다
          </Text>
        ) : (
          <Pressable onPress={handleEnablePush} disabled={pushLoading}>
            <Text style={styles.pushButton}>
              {pushLoading ? "설정 중..." : "푸시 알림 허용하기"}
            </Text>
          </Pressable>
        )}
      </View>

      <View style={styles.divider} />

      {/* 로그아웃 */}
      <View style={styles.section}>
        <Pressable onPress={handleLogout}>
          <Text style={styles.logoutText}>로그아웃</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    paddingHorizontal: containerPadding,
    paddingTop: 16,
  },
  section: {
    paddingVertical: 20,
  },
  sectionLabel: {
    fontSize: 12,
    color: colors.gray[400],
    marginBottom: 8,
  },
  sectionValue: {
    fontSize: 14,
  },
  sectionSub: {
    fontSize: 12,
    color: colors.gray[400],
    marginTop: 4,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.gray[100],
  },
  pushEnabled: {
    fontSize: 14,
    color: colors.gray[500],
  },
  pushButton: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.black,
  },
  logoutText: {
    fontSize: 14,
    color: colors.gray[500],
  },
  emptyText: {
    fontSize: 14,
    color: colors.gray[400],
  },
});
