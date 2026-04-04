import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Linking,
  StyleSheet,
} from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter, Link } from "expo-router";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { SubscribeButton } from "@/components/artist/SubscribeButton";
import { Skeleton } from "@/components/ui/Skeleton";
import { colors } from "@/theme/colors";
import { containerPadding } from "@/theme/spacing";

interface ConcertDetail {
  id: string;
  title: string;
  venue: string | null;
  startDate: string | null;
  endDate: string | null;
  ticketOpenDate: string | null;
  source: string;
  sourceUrl: string;
  imageUrl: string | null;
  genre: string;
  status: string;
  artist: {
    id: string;
    name: string;
    nameEn: string | null;
    imageUrl: string | null;
    subscriberCount: number;
  } | null;
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function sourceLabel(source: string) {
  switch (source) {
    case "INTERPARK": return "인터파크";
    case "YES24": return "YES24";
    case "MELON": return "멜론티켓";
    default: return source;
  }
}

const GENRE_LABELS: Record<string, string> = {
  CONCERT: "콘서트", FESTIVAL: "페스티벌", FANMEETING: "팬미팅",
  MUSICAL: "뮤지컬", CLASSIC: "클래식", HIPHOP: "힙합/R&B",
  TROT: "트로트", OTHER: "기타",
};

const STATUS_LABELS: Record<string, string> = {
  UPCOMING: "예정", ON_SALE: "판매중", SOLD_OUT: "매진",
  COMPLETED: "종료", CANCELLED: "취소",
};

export default function ConcertDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { fetch: fetchSubs } = useSubscriptions();
  const [concert, setConcert] = useState<ConcertDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      try {
        const data = await api<ConcertDetail>(`/concerts/${id}`);
        setConcert(data);
      } catch {
        setConcert(null);
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
        <View style={styles.posterWrap}>
          <Skeleton width={240} height={320} borderRadius={6} />
        </View>
        <Skeleton width="75%" height={24} style={{ alignSelf: "center", marginTop: 24 }} />
        <Skeleton width="50%" height={16} style={{ alignSelf: "center", marginTop: 12 }} />
      </View>
    );
  }

  if (!concert) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>공연을 찾을 수 없습니다</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backLink}>돌아가기</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
    >
      {/* 포스터 */}
      <View style={styles.posterWrap}>
        <View style={styles.poster}>
          {concert.imageUrl ? (
            <Image
              source={{ uri: concert.imageUrl }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
            />
          ) : (
            <Text style={styles.noImage}>No Image</Text>
          )}
        </View>
      </View>

      {/* 공연 정보 */}
      <View style={styles.info}>
        <Text style={styles.title}>{concert.title}</Text>

        <View style={styles.details}>
          {concert.venue && (
            <Text style={styles.detailText}>{concert.venue}</Text>
          )}
          <Text style={styles.detailText}>
            {formatDate(concert.startDate)}
            {concert.endDate && concert.endDate !== concert.startDate
              ? ` ~ ${formatDate(concert.endDate)}`
              : ""}
          </Text>
          {concert.ticketOpenDate && (
            <Text style={styles.ticketOpen}>
              티켓 오픈 {formatDate(concert.ticketOpenDate)}
            </Text>
          )}
        </View>

        <View style={styles.tags}>
          <Text style={styles.sourceTag}>{sourceLabel(concert.source)}</Text>
          <View style={styles.genreBadge}>
            <Text style={styles.genreText}>
              {GENRE_LABELS[concert.genre] ?? concert.genre}
            </Text>
          </View>
          <Text style={styles.sourceTag}>
            {STATUS_LABELS[concert.status] ?? concert.status}
          </Text>
        </View>

        {/* 예매 버튼 */}
        <Pressable
          style={styles.bookButton}
          onPress={() => Linking.openURL(concert.sourceUrl)}
        >
          <Text style={styles.bookButtonText}>
            {sourceLabel(concert.source)}에서 예매하기
          </Text>
        </Pressable>
      </View>

      {/* 아티스트 */}
      {concert.artist && (
        <View style={styles.artistSection}>
          <Text style={styles.artistSectionTitle}>아티스트</Text>
          <View style={styles.artistRow}>
            <Pressable onPress={() => router.push(`/artist/${concert.artist!.id}`)}>
              <View style={styles.artistAvatar}>
                {concert.artist.imageUrl ? (
                  <Image
                    source={{ uri: concert.artist.imageUrl }}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                  />
                ) : (
                  <Text style={styles.avatarText}>
                    {concert.artist.name[0]}
                  </Text>
                )}
              </View>
            </Pressable>
            <View style={styles.artistInfo}>
              <Pressable onPress={() => router.push(`/artist/${concert.artist!.id}`)}>
                <Text style={styles.artistName}>{concert.artist.name}</Text>
              </Pressable>
              {concert.artist.nameEn && (
                <Text style={styles.artistNameEn}>
                  {concert.artist.nameEn}
                </Text>
              )}
              <Text style={styles.subscriberCount}>
                구독자 {concert.artist.subscriberCount}명
              </Text>
            </View>
            <SubscribeButton artistId={concert.artist.id} />
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    paddingTop: 32,
    paddingHorizontal: containerPadding,
  },
  scroll: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 40,
    paddingHorizontal: containerPadding,
  },
  posterWrap: {
    alignItems: "center",
    marginBottom: 32,
  },
  poster: {
    width: 240,
    height: 320,
    backgroundColor: colors.gray[50],
    borderRadius: 6,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  noImage: {
    fontSize: 14,
    color: colors.gray[200],
  },
  info: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 28,
  },
  details: {
    marginTop: 16,
    gap: 6,
    alignItems: "center",
  },
  detailText: {
    fontSize: 14,
    color: colors.gray[500],
  },
  ticketOpen: {
    fontSize: 14,
    color: colors.gray[400],
  },
  tags: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 16,
  },
  sourceTag: {
    fontSize: 12,
    color: colors.gray[300],
  },
  genreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: colors.gray[100],
  },
  genreText: {
    fontSize: 12,
    color: colors.gray[500],
  },
  bookButton: {
    marginTop: 24,
    backgroundColor: colors.black,
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  bookButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.white,
  },
  artistSection: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.gray[100],
    paddingTop: 32,
  },
  artistSectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 24,
  },
  artistRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  artistAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.gray[100],
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 20,
    color: colors.gray[300],
  },
  artistInfo: {
    flex: 1,
  },
  artistName: {
    fontSize: 16,
    fontWeight: "600",
  },
  artistNameEn: {
    fontSize: 12,
    color: colors.gray[400],
    marginTop: 2,
  },
  subscriberCount: {
    fontSize: 12,
    color: colors.gray[300],
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: containerPadding,
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
