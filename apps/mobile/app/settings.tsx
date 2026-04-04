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
      <View style={styles.headline}>
        <Text style={styles.headlineTitle}>Settings</Text>
        <Text style={styles.headlineSubtitle}>환경 설정</Text>
      </View>

      {/* 계정 */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>계정</Text>
        <Text style={styles.sectionValue}>{user.nickname}</Text>
        {user.email && (
          <Text style={styles.sectionSub}>{user.email}</Text>
        )}
      </View>

      {/* 알림 */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>알림</Text>
        {pushEnabled ? (
          <View style={styles.pushCard}>
            <Text style={styles.pushEnabled}>
              푸시 알림이 활성화되었습니다
            </Text>
          </View>
        ) : (
          <Pressable style={styles.pushCard} onPress={handleEnablePush} disabled={pushLoading}>
            <Text style={styles.pushButton}>
              {pushLoading ? "설정 중..." : "푸시 알림 허용하기"}
            </Text>
          </Pressable>
        )}
      </View>

      {/* 로그아웃 */}
      <View style={styles.logoutSection}>
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
    backgroundColor: colors.surface,
    paddingHorizontal: containerPadding,
  },
  headline: {
    paddingTop: 32,
    paddingBottom: 24,
  },
  headlineTitle: {
    fontFamily: "Manrope-ExtraBold",
    fontSize: 42,
    letterSpacing: -1,
    color: colors.primary,
  },
  headlineSubtitle: {
    fontFamily: "Inter-Medium",
    fontSize: 16,
    color: colors.onSurfaceVariant,
    marginTop: 12,
  },
  card: {
    backgroundColor: colors.surfaceContainerLow,
    padding: 24,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter-Bold",
    color: colors.onSurfaceVariant,
    textTransform: "uppercase" as const,
    letterSpacing: 3,
    marginBottom: 12,
  },
  sectionValue: {
    fontSize: 14,
    fontFamily: "Inter-Bold",
    color: colors.onSurface,
  },
  sectionSub: {
    fontSize: 12,
    fontFamily: "Inter",
    color: colors.onSurfaceVariant,
    marginTop: 4,
  },
  pushCard: {
    backgroundColor: colors.surfaceContainerLowest,
    padding: 16,
    borderRadius: 8,
  },
  pushEnabled: {
    fontSize: 14,
    fontFamily: "Inter",
    color: colors.onSurfaceVariant,
  },
  pushButton: {
    fontSize: 14,
    fontFamily: "Inter-Bold",
    color: colors.primary,
  },
  logoutSection: {
    paddingTop: 16,
  },
  logoutText: {
    fontSize: 14,
    fontFamily: "Inter-Medium",
    color: colors.onSurfaceVariant,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter",
    color: colors.onSurfaceVariant,
  },
});
