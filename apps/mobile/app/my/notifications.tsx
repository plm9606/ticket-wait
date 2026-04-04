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
  id: string;
  type: string;
  concert: {
    id: string;
    title: string;
    source: string;
    sourceUrl: string;
    imageUrl: string | null;
    artist: { id: string; name: string; nameEn: string | null } | null;
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
    Linking.openURL(item.concert.sourceUrl);
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
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      renderItem={({ item }) => (
        <Pressable
          style={[styles.row, item.read && styles.readRow]}
          onPress={() => handlePress(item)}
        >
          {!item.read && <View style={styles.unreadDot} />}
          <View style={[styles.content, item.read && styles.readContent]}>
            <View style={styles.tagRow}>
              <View style={styles.typeBadge}>
                <Text style={styles.typeText}>{typeLabel(item.type)}</Text>
              </View>
              <Text style={styles.timeText}>{timeAgo(item.createdAt)}</Text>
            </View>
            <Text style={styles.title} numberOfLines={2}>
              {item.concert.title}
            </Text>
            {item.concert.artist && (
              <Text style={styles.artist}>{item.concert.artist.name}</Text>
            )}
          </View>
          {item.concert.imageUrl && (
            <View style={styles.thumbnail}>
              <Image
                source={{ uri: item.concert.imageUrl }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
              />
            </View>
          )}
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
            color={colors.gray[400]}
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
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.gray[100],
  },
  row: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 16,
    alignItems: "flex-start",
  },
  readRow: {
    opacity: 0.6,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.black,
    marginTop: 8,
  },
  content: {
    flex: 1,
  },
  readContent: {
    marginLeft: 18,
  },
  tagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: colors.gray[100],
  },
  typeText: {
    fontSize: 10,
    fontWeight: "500",
    color: colors.gray[500],
  },
  timeText: {
    fontSize: 10,
    color: colors.gray[300],
  },
  title: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 18,
  },
  artist: {
    fontSize: 12,
    color: colors.gray[400],
    marginTop: 2,
  },
  thumbnail: {
    width: 48,
    height: 64,
    backgroundColor: colors.gray[50],
    overflow: "hidden",
    borderRadius: 2,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  emptySection: {
    paddingVertical: 64,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: colors.gray[400],
  },
  searchLink: {
    fontSize: 14,
    textDecorationLine: "underline",
    marginTop: 16,
  },
  loader: {
    paddingVertical: 24,
  },
  loadMore: {
    marginTop: 16,
    paddingVertical: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.gray[100],
    alignItems: "center",
  },
  loadMoreText: {
    fontSize: 14,
    color: colors.gray[400],
  },
});
