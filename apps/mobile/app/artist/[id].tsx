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

interface Concert {
  id: string;
  title: string;
  venue: string | null;
  startDate: string | null;
  endDate: string | null;
  source: string;
  sourceUrl: string;
  imageUrl: string | null;
  genre: string;
  status: string;
}

interface ArtistDetail {
  id: string;
  name: string;
  nameEn: string | null;
  aliases: string[];
  imageUrl: string | null;
  subscriberCount: number;
  concerts: Concert[];
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
        <View style={styles.profileCenter}>
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
      {/* 프로필 */}
      <View style={styles.profileCenter}>
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

      {/* 공연 헤더 */}
      <View style={styles.concertHeader}>
        <Text style={styles.concertTitle}>
          공연{" "}
          <Text style={styles.concertCount}>{artist.concerts.length}</Text>
        </Text>
      </View>

      {artist.concerts.length === 0 && (
        <View style={styles.noConcerts}>
          <Text style={styles.noConcertsText}>등록된 공연이 없습니다</Text>
        </View>
      )}
    </View>
  );

  return (
    <FlatList
      data={artist.concerts}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={headerComponent}
      contentContainerStyle={styles.listContent}
      renderItem={({ item }) => <ConcertCard concert={item} />}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    paddingTop: 32,
    paddingHorizontal: containerPadding,
  },
  profileCenter: {
    alignItems: "center",
    paddingVertical: 16,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.gray[100],
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 30,
    color: colors.gray[300],
  },
  name: {
    fontSize: 24,
    fontWeight: "700",
    marginTop: 16,
  },
  nameEn: {
    fontSize: 14,
    color: colors.gray[400],
    marginTop: 4,
  },
  subscriberCount: {
    fontSize: 12,
    color: colors.gray[300],
    marginTop: 8,
  },
  subscribeWrap: {
    marginTop: 24,
  },
  concertHeader: {
    marginTop: 16,
    marginBottom: 24,
  },
  concertTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  concertCount: {
    color: colors.gray[300],
    fontWeight: "400",
  },
  noConcerts: {
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderStyle: "dashed",
    paddingVertical: 48,
    alignItems: "center",
    borderRadius: 6,
  },
  noConcertsText: {
    fontSize: 14,
    color: colors.gray[400],
  },
  listContent: {
    paddingHorizontal: containerPadding,
    paddingBottom: 40,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 14,
    color: colors.gray[400],
  },
  backLink: {
    fontSize: 14,
    textDecorationLine: "underline",
    marginTop: 16,
  },
});
