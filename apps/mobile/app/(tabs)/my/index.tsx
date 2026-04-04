import { useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
} from "react-native";
import { Image } from "expo-image";
import { useRouter, Link } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/hooks/useAuth";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { Skeleton } from "@/components/ui/Skeleton";
import { colors } from "@/theme/colors";
import { containerPadding } from "@/theme/spacing";

export default function MyScreen() {
  const { user, loading: authLoading, login } = useAuth();
  const {
    subscriptions,
    loading: subsLoading,
    fetch: fetchSubs,
  } = useSubscriptions();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (user) fetchSubs();
  }, [user]);

  if (authLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
        <Skeleton width={192} height={32} />
        <Skeleton width={128} height={16} style={{ marginTop: 8 }} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
        <View style={styles.loginPrompt}>
          <Text style={styles.loginText}>
            로그인하고 좋아하는 아티스트를 구독하세요
          </Text>
          <Pressable style={styles.kakaoButton} onPress={login}>
            <Text style={styles.kakaoButtonText}>카카오로 시작하기</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      {/* 프로필 */}
      <View style={styles.profileRow}>
        <View style={styles.profileAvatar}>
          {user.profileImage ? (
            <Image
              source={{ uri: user.profileImage }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
            />
          ) : (
            <Text style={styles.profileAvatarText}>{user.nickname[0]}</Text>
          )}
        </View>
        <View>
          <Text style={styles.profileName}>{user.nickname}</Text>
          <Text style={styles.profileEmail}>{user.email || ""}</Text>
        </View>
      </View>

      {/* 메뉴 */}
      <View style={styles.menuRow}>
        <Pressable
          style={styles.menuItem}
          onPress={() => router.push("/my/notifications")}
        >
          <Text style={styles.menuText}>알림</Text>
        </Pressable>
        <Pressable
          style={styles.menuItem}
          onPress={() => router.push("/settings")}
        >
          <Text style={styles.menuText}>설정</Text>
        </Pressable>
      </View>

      {/* 구독 헤더 */}
      <View style={styles.subHeader}>
        <Text style={styles.subTitle}>
          내 구독{" "}
          <Text style={styles.subCount}>{subscriptions.length}</Text>
        </Text>
        <Pressable onPress={() => router.push("/search")}>
          <Text style={styles.addText}>+ 추가</Text>
        </Pressable>
      </View>

      {subsLoading ? (
        <View style={styles.grid}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <View key={i} style={styles.gridItem}>
              <Skeleton width="100%" height={100} borderRadius={6} />
              <Skeleton width={64} height={12} style={{ marginTop: 8 }} />
            </View>
          ))}
        </View>
      ) : subscriptions.length === 0 ? (
        <View style={styles.emptySubs}>
          <Text style={styles.emptySubsText}>
            아직 구독한 아티스트가 없어요
          </Text>
          <Pressable onPress={() => router.push("/search")}>
            <Text style={styles.searchLink}>아티스트 검색하기</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={subscriptions}
          numColumns={3}
          keyExtractor={(item) => item.id}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.gridList}
          renderItem={({ item }) => (
            <Pressable
              style={styles.gridItem}
              onPress={() => router.push(`/artist/${item.artistId}`)}
            >
              <View style={styles.gridAvatar}>
                {item.imageUrl ? (
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                  />
                ) : (
                  <Text style={styles.gridAvatarText}>{item.name[0]}</Text>
                )}
              </View>
              <Text style={styles.gridName} numberOfLines={1}>
                {item.name}
              </Text>
              {item.nameEn && (
                <Text style={styles.gridNameEn} numberOfLines={1}>
                  {item.nameEn}
                </Text>
              )}
              {item.concertCount > 0 && (
                <Text style={styles.gridConcertCount}>
                  공연 {item.concertCount}건
                </Text>
              )}
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    paddingHorizontal: containerPadding,
  },
  loginPrompt: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 100,
  },
  loginText: {
    fontSize: 14,
    color: colors.gray[500],
    marginBottom: 24,
  },
  kakaoButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEE500",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 6,
  },
  kakaoButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#191919",
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 24,
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.gray[100],
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  profileAvatarText: {
    fontSize: 18,
    color: colors.gray[400],
  },
  profileName: {
    fontSize: 16,
    fontWeight: "600",
  },
  profileEmail: {
    fontSize: 12,
    color: colors.gray[400],
    marginTop: 2,
  },
  menuRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 32,
  },
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.gray[200],
  },
  menuText: {
    fontSize: 13,
    color: colors.gray[600],
  },
  subHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  subTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  subCount: {
    color: colors.gray[300],
    fontWeight: "400",
  },
  addText: {
    fontSize: 12,
    color: colors.gray[400],
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  gridRow: {
    gap: 16,
  },
  gridList: {
    gap: 16,
    paddingBottom: 40,
  },
  gridItem: {
    flex: 1,
    maxWidth: "31%",
  },
  gridAvatar: {
    aspectRatio: 1,
    backgroundColor: colors.gray[50],
    borderRadius: 6,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  gridAvatarText: {
    fontSize: 24,
    color: colors.gray[300],
  },
  gridName: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 8,
  },
  gridNameEn: {
    fontSize: 10,
    color: colors.gray[400],
  },
  gridConcertCount: {
    fontSize: 10,
    color: colors.gray[300],
    marginTop: 2,
  },
  emptySubs: {
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderStyle: "dashed",
    borderRadius: 6,
    paddingVertical: 64,
    alignItems: "center",
  },
  emptySubsText: {
    fontSize: 14,
    color: colors.gray[400],
    marginBottom: 16,
  },
  searchLink: {
    fontSize: 14,
    fontWeight: "500",
    textDecorationLine: "underline",
  },
});
