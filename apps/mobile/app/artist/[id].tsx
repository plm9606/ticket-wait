import { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
} from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { SubscribeButton } from "@/components/artist/SubscribeButton";
import { ConcertCard } from "@/components/concert/ConcertCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { colors } from "@/theme/colors";
import { containerPadding } from "@/theme/spacing";

interface Performance {
  id: number;
  title: string;
  startDate: string | null;
  endDate: string | null;
  source: string;
  sourceUrl: string;
  imageUrl: string | null;
  genre: string;
  status: string;
  ticketOpenDate: string | null;
}

interface ArtistDetail {
  id: number;
  name: string;
  nameEn: string | null;
  aliases: string[];
  imageUrl: string | null;
  subscriberCount: number;
  performances: Performance[];
}

export default function ArtistDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { fetch: fetchSubs } = useSubscriptions();
  const [artist, setArtist] = useState<ArtistDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      try {
        const data = await api<ArtistDetail>(`/artists/${id}`);
        setArtist(data);
      } catch {
        setArtist(null);
      } finally {
        setLoading(false);
      }
    }
    load();
    if (user) fetchSubs();
  }, [id, user]);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={{ alignItems: "center", paddingTop: 40 }}>
          <Skeleton width={96} height={96} borderRadius={48} />
          <Skeleton width={160} height={24} style={{ marginTop: 16 }} />
          <Skeleton width={96} height={16} style={{ marginTop: 8 }} />
        </View>
      </View>
    );
  }

  if (!artist) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>아티스트를 찾을 수 없습니다</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backLink}>돌아가기</Text>
        </Pressable>
      </View>
    );
  }

  const headerComponent = (
    <View>
      {/* 프로필 — 에디토리얼 좌정렬 */}
      <View style={styles.profileSection}>
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            {artist.imageUrl ? (
              <Image
                source={{ uri: artist.imageUrl }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
              />
            ) : (
              <Text style={styles.avatarText}>{artist.name[0]}</Text>
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{artist.name}</Text>
            {artist.nameEn && (
              <Text style={styles.nameEn}>{artist.nameEn}</Text>
            )}
            <Text style={styles.subscriberCount}>
              구독자 {artist.subscriberCount}명
            </Text>
            <View style={styles.subscribeWrap}>
              <SubscribeButton artistId={artist.id} />
            </View>
          </View>
        </View>
      </View>

      {/* 공연 헤더 */}
      <View style={styles.concertHeader}>
        <Text style={styles.concertTitle}>
          공연{" "}
          <Text style={styles.concertCount}>{artist.performances.length}</Text>
        </Text>
      </View>

      {artist.performances.length === 0 && (
        <View style={styles.noConcerts}>
          <Text style={styles.noConcertsText}>등록된 공연이 없습니다</Text>
        </View>
      )}
    </View>
  );

  return (
    <FlatList
      data={artist.performances}
      keyExtractor={(item) => String(item.id)}
      ListHeaderComponent={headerComponent}
      contentContainerStyle={styles.listContent}
      renderItem={({ item }) => <ConcertCard performance={item} />}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingTop: 32,
    paddingHorizontal: containerPadding,
  },
  profileSection: {
    backgroundColor: colors.surfaceContainerLow,
    paddingVertical: 40,
    paddingHorizontal: containerPadding,
    marginHorizontal: -containerPadding,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  profileInfo: {
    flex: 1,
  },
  avatar: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: colors.surfaceContainer,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 30,
    fontFamily: "Inter-Medium",
    color: colors.onSurfaceVariant,
  },
  name: {
    fontFamily: "Manrope-ExtraBold",
    fontSize: 36,
    letterSpacing: -1.5,
    color: colors.primary,
  },
  nameEn: {
    fontSize: 10,
    fontFamily: "Inter-Bold",
    color: colors.onSurfaceVariant,
    textTransform: "uppercase" as const,
    letterSpacing: 1.5,
    marginTop: 6,
  },
  subscriberCount: {
    fontSize: 12,
    fontFamily: "Inter",
    color: colors.onSurfaceVariant,
    marginTop: 8,
  },
  subscribeWrap: {
    marginTop: 16,
  },
  concertHeader: {
    marginTop: 32,
    marginBottom: 24,
  },
  concertTitle: {
    fontSize: 18,
    fontFamily: "Manrope-Bold",
    color: colors.onSurface,
  },
  concertCount: {
    color: colors.onSurfaceVariant,
    fontFamily: "Inter",
  },
  noConcerts: {
    backgroundColor: colors.surfaceContainerLow,
    paddingVertical: 48,
    alignItems: "center",
    borderRadius: 12,
  },
  noConcertsText: {
    fontSize: 14,
    fontFamily: "Inter",
    color: colors.onSurfaceVariant,
  },
  listContent: {
    paddingHorizontal: containerPadding,
    paddingBottom: 40,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter",
    color: colors.onSurfaceVariant,
  },
  backLink: {
    fontSize: 14,
    fontFamily: "Inter-Medium",
    textDecorationLine: "underline",
    marginTop: 16,
    color: colors.onSurfaceVariant,
  },
});
