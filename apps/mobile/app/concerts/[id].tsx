import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Linking,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { SubscribeButton } from "@/components/artist/SubscribeButton";
import { Skeleton } from "@/components/ui/Skeleton";
import { colors } from "@/theme/colors";
import { containerPadding } from "@/theme/spacing";

const { width: screenWidth } = Dimensions.get("window");

interface PerformanceDetail {
  id: number;
  title: string;
  venue: { id: number; name: string; address: string | null } | null;
  startDate: string | null;
  endDate: string | null;
  ticketOpenDate: string | null;
  source: string;
  sourceUrl: string;
  imageUrl: string | null;
  genre: string;
  status: string;
  artists: Array<{
    id: number;
    name: string;
    nameEn: string | null;
    imageUrl: string | null;
    subscriberCount: number;
  }>;
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getDday(dateStr: string | null): string | null {
  if (!dateStr) return null;
  const diff = Math.ceil(
    (new Date(dateStr).getTime() - Date.now()) / 86400000
  );
  if (diff < 0) return null;
  if (diff === 0) return "D-DAY";
  return `D-${diff}`;
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

export default function PerformanceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { fetch: fetchSubs } = useSubscriptions();
  const [performance, setPerformance] = useState<PerformanceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      try {
        const data = await api<PerformanceDetail>(`/performances/${id}`);
        setPerformance(data);
      } catch {
        setPerformance(null);
      } finally {
        setLoading(false);
      }
    }
    load();
    if (user) fetchSubs();
  }, [id, user]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Skeleton width={screenWidth} height={screenWidth * 0.8} borderRadius={0} />
        <View style={styles.loadingContent}>
          <Skeleton width={screenWidth - 40} height={100} borderRadius={12} />
          <Skeleton width="60%" height={16} style={{ marginTop: 24 }} />
          <Skeleton width="40%" height={24} style={{ marginTop: 8 }} />
        </View>
      </View>
    );
  }

  if (!performance) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>공연을 찾을 수 없습니다</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backLink}>돌아가기</Text>
        </Pressable>
      </View>
    );
  }

  const dday = getDday(performance.ticketOpenDate);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
    >
      {/* 풀블리드 히어로 */}
      <View style={styles.hero}>
        {performance.imageUrl ? (
          <Image
            source={{ uri: performance.imageUrl }}
            style={[StyleSheet.absoluteFill, styles.heroImage]}
            contentFit="cover"
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.gray[800] }]} />
        )}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.2)", "rgba(0,0,0,0.6)"]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.heroContent}>
          <View style={styles.genreBadge}>
            <Text style={styles.genreBadgeText}>
              {GENRE_LABELS[performance.genre] ?? performance.genre}
            </Text>
          </View>
          <Text style={styles.heroTitle}>{performance.title}</Text>
          <View style={styles.heroMeta}>
            {performance.startDate && (
              <Text style={styles.heroMetaText}>
                {formatDate(performance.startDate)}
              </Text>
            )}
            {performance.venue && (
              <Text style={styles.heroMetaText}>{performance.venue.name}</Text>
            )}
          </View>
        </View>
      </View>

      {/* Quick Actions 카드 */}
      <View style={styles.actionsCard}>
        <View style={styles.statusRow}>
          <Text style={styles.sectionLabel}>상태</Text>
          <View style={styles.statusValue}>
            <View style={styles.pulseDot} />
            <Text style={styles.statusText}>
              {STATUS_LABELS[performance.status] ?? performance.status}
            </Text>
          </View>
        </View>
        <View style={styles.actionButtons}>
          <Pressable
            style={styles.bookButton}
            onPress={() => Linking.openURL(performance.sourceUrl)}
          >
            <Text style={styles.bookButtonText}>예매하기</Text>
          </Pressable>
        </View>
      </View>

      {/* 티켓 오픈일 */}
      {performance.ticketOpenDate && (
        <View style={styles.ticketOpenSection}>
          <Text style={styles.sectionLabel}>TICKET OPEN</Text>
          <Text style={styles.ticketOpenDate}>
            {formatDate(performance.ticketOpenDate)}
          </Text>
          {dday && <Text style={styles.ddayText}>{dday}</Text>}
        </View>
      )}

      {/* 공연 정보 */}
      <View style={styles.infoSection}>
        {performance.venue && (
          <View style={styles.infoItem}>
            <Text style={styles.sectionLabel}>VENUE</Text>
            <Text style={styles.infoValue}>{performance.venue.name}</Text>
          </View>
        )}
        <View style={styles.infoItem}>
          <Text style={styles.sectionLabel}>SOURCE</Text>
          <Text style={styles.infoValue}>{sourceLabel(performance.source)}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.sectionLabel}>DATE</Text>
          <Text style={styles.infoValue}>
            {formatDate(performance.startDate)}
            {performance.endDate && performance.endDate !== performance.startDate
              ? ` — ${formatDate(performance.endDate)}`
              : ""}
          </Text>
        </View>
      </View>

      {/* 아티스트 섹션 */}
      {performance.artists[0] && (
        <View style={styles.artistSection}>
          <Text style={styles.sectionLabel}>ARTIST</Text>
          <View style={styles.artistRow}>
            <Pressable onPress={() => router.push(`/artist/${performance.artists[0].id}`)}>
              <View style={styles.artistAvatar}>
                {performance.artists[0].imageUrl ? (
                  <Image
                    source={{ uri: performance.artists[0].imageUrl }}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                  />
                ) : (
                  <Text style={styles.avatarText}>
                    {performance.artists[0].name[0]}
                  </Text>
                )}
              </View>
            </Pressable>
            <View style={styles.artistInfo}>
              <Pressable onPress={() => router.push(`/artist/${performance.artists[0].id}`)}>
                <Text style={styles.artistName}>{performance.artists[0].name}</Text>
              </Pressable>
              {performance.artists[0].nameEn && (
                <Text style={styles.artistNameEn}>
                  {performance.artists[0].nameEn}
                </Text>
              )}
              <Text style={styles.subscriberCount}>
                구독자 {performance.artists[0].subscriberCount}명
              </Text>
            </View>
            <SubscribeButton artistId={performance.artists[0].id} />
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const HERO_HEIGHT = screenWidth * 0.8;

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.white,
  },
  loadingContent: {
    paddingHorizontal: containerPadding,
    marginTop: -40,
  },

  // 히어로
  hero: {
    width: screenWidth,
    height: HERO_HEIGHT,
    backgroundColor: colors.black,
    overflow: "hidden",
  },
  heroImage: {
    opacity: 0.7,
  },
  heroContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: containerPadding,
    paddingBottom: 24,
  },
  genreBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  genreBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 3,
    color: colors.white,
    textTransform: "uppercase",
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: "900",
    color: colors.white,
    letterSpacing: -1,
    lineHeight: 42,
    marginTop: 8,
  },
  heroMeta: {
    flexDirection: "row",
    gap: 16,
    marginTop: 12,
  },
  heroMetaText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
  },

  // Quick Actions 카드
  actionsCard: {
    marginTop: -40,
    marginHorizontal: containerPadding,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 24,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.04,
    shadowRadius: 24,
    elevation: 4,
    zIndex: 10,
  },
  statusRow: {
    marginBottom: 20,
  },
  statusValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gray[900],
  },
  statusText: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  bookButton: {
    flex: 1,
    backgroundColor: colors.black,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  bookButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.white,
  },

  // 티켓 오픈
  ticketOpenSection: {
    paddingHorizontal: containerPadding,
    paddingTop: 28,
    paddingBottom: 28,
    marginTop: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.gray[200],
  },
  ticketOpenDate: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.5,
    marginTop: 4,
  },
  ddayText: {
    fontSize: 14,
    color: colors.gray[400],
    marginTop: 4,
  },

  // 공연 정보
  infoSection: {
    paddingHorizontal: containerPadding,
    paddingTop: 24,
    paddingBottom: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.gray[100],
    gap: 24,
  },
  infoItem: {},
  infoValue: {
    fontSize: 14,
    color: colors.gray[800],
    marginTop: 4,
    lineHeight: 20,
  },

  // 공통 라벨
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 3,
    color: colors.gray[400],
    textTransform: "uppercase",
  },

  // 아티스트
  artistSection: {
    paddingHorizontal: containerPadding,
    paddingTop: 28,
    marginTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.gray[100],
    paddingBottom: 8,
  },
  artistRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginTop: 20,
  },
  artistAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.gray[100],
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 18,
    color: colors.gray[300],
  },
  artistInfo: {
    flex: 1,
  },
  artistName: {
    fontSize: 15,
    fontWeight: "700",
  },
  artistNameEn: {
    fontSize: 11,
    color: colors.gray[400],
    letterSpacing: 1,
    marginTop: 2,
  },
  subscriberCount: {
    fontSize: 11,
    color: colors.gray[300],
    marginTop: 2,
  },

  // 빈 상태
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
