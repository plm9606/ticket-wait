import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  Linking,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { colors } from "@/theme/colors";
import { containerPadding } from "@/theme/spacing";

interface NotificationItem {
  id: number;
  type: string;
  performance: {
    id: number;
    title: string;
    source: string;
    sourceUrl: string;
    imageUrl: string | null;
    artist: { id: number; name: string; nameEn: string | null } | null;
  };
  read: boolean;
  createdAt: string;
}

interface NotificationResponse {
  items: NotificationItem[];
  nextCursor: string | null;
}

function typeLabel(type: string) {
  switch (type) {
    case "NEW_CONCERT": return "새 공연";
    case "TICKET_OPEN_SOON": return "티켓 오픈";
    default: return "알림";
  }
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;
  return new Date(dateStr).toLocaleDateString("ko-KR");
}

export default function NotificationsScreen() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const router = useRouter();

  const load = useCallback(async (nextCursor?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "20" });
      if (nextCursor) params.set("cursor", nextCursor);
      const data = await api<NotificationResponse>(
        `/notifications/history?${params}`
      );
      setNotifications((prev) =>
        nextCursor ? [...prev, ...data.items] : data.items
      );
      setCursor(data.nextCursor);
      setHasMore(!!data.nextCursor);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  const markAsRead = async (id: string) => {
    await api(`/notifications/${id}/read`, { method: "PATCH" });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handlePress = (item: NotificationItem) => {
    if (!item.read) markAsRead(item.id);
    Linking.openURL(item.performance.sourceUrl);
  };

  if (!user) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>로그인이 필요합니다</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={notifications}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      ListHeaderComponent={
        <View style={styles.headline}>
          <Text style={styles.headlineTitle}>Alerts</Text>
          <Text style={styles.headlineSubtitle}>놓치지 않는 알림</Text>
        </View>
      }
      renderItem={({ item }) => (
        <Pressable
          style={[styles.card, item.read && styles.readCard]}
          onPress={() => handlePress(item)}
        >
          {item.performance.imageUrl && (
            <View style={styles.thumbnail}>
              <Image
                source={{ uri: item.performance.imageUrl }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
              />
            </View>
          )}
          <View style={styles.content}>
            <View style={styles.tagRow}>
              <View style={styles.typeBadge}>
                <Text style={styles.typeText}>{typeLabel(item.type)}</Text>
              </View>
              <Text style={styles.timeText}>{timeAgo(item.createdAt)}</Text>
            </View>
            <Text style={styles.title} numberOfLines={2}>
              {item.performance.title}
            </Text>
            {item.performance.artist && (
              <Text style={styles.artist}>{item.performance.artist.name}</Text>
            )}
          </View>
          {!item.read && <View style={styles.unreadDot} />}
        </Pressable>
      )}
      ListEmptyComponent={
        !loading ? (
          <View style={styles.emptySection}>
            <Text style={styles.emptyText}>아직 알림이 없습니다</Text>
            <Pressable onPress={() => router.push("/search")}>
              <Text style={styles.searchLink}>아티스트를 구독해보세요</Text>
            </Pressable>
          </View>
        ) : null
      }
      ListFooterComponent={
        loading ? (
          <ActivityIndicator
            style={styles.loader}
            color={colors.onSurfaceVariant}
          />
        ) : hasMore ? (
          <Pressable
            style={styles.loadMore}
            onPress={() => cursor && load(cursor)}
          >
            <Text style={styles.loadMoreText}>더 보기</Text>
          </Pressable>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: containerPadding,
    paddingBottom: 40,
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
    flexDirection: "row",
    gap: 16,
    padding: 20,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 16,
    alignItems: "flex-start",
    marginBottom: 12,
  },
  readCard: {
    opacity: 0.6,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 8,
  },
  content: {
    flex: 1,
  },
  tagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: colors.secondaryContainer,
    borderRadius: 9999,
  },
  typeText: {
    fontSize: 10,
    fontFamily: "Inter-Bold",
    color: colors.onSecondaryContainer,
    textTransform: "uppercase" as const,
  },
  timeText: {
    fontSize: 10,
    fontFamily: "Inter",
    color: colors.outline,
  },
  title: {
    fontSize: 14,
    fontFamily: "Manrope-Bold",
    letterSpacing: -0.3,
    lineHeight: 18,
    color: colors.onSurface,
  },
  artist: {
    fontSize: 12,
    fontFamily: "Inter",
    color: colors.onSurfaceVariant,
    marginTop: 4,
  },
  thumbnail: {
    width: 56,
    height: 56,
    backgroundColor: colors.surfaceContainer,
    overflow: "hidden",
    borderRadius: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  emptySection: {
    paddingVertical: 64,
    alignItems: "center",
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter",
    color: colors.onSurfaceVariant,
  },
  searchLink: {
    fontSize: 14,
    fontFamily: "Inter-Bold",
    color: colors.primary,
    textDecorationLine: "underline",
    marginTop: 16,
  },
  loader: {
    paddingVertical: 24,
  },
  loadMore: {
    marginTop: 16,
    paddingVertical: 14,
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 12,
    alignItems: "center",
  },
  loadMoreText: {
    fontSize: 14,
    fontFamily: "Inter-Medium",
    color: colors.onSurfaceVariant,
  },
});
