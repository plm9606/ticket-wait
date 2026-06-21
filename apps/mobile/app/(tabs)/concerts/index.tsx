import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "@/lib/api";
import { ConcertCard } from "@/components/concert/ConcertCard";
import { colors } from "@/theme/colors";
import { containerPadding } from "@/theme/spacing";

interface Performance {
  id: number;
  title: string;
  artists: Array<{ id: number; name: string; nameEn: string | null }>;
  venue: { id: number; name: string } | null;
  startDate: string | null;
  endDate: string | null;
  source: string;
  sourceUrl: string;
  imageUrl: string | null;
  genre: string;
  status: string;
}

interface PerformanceListResponse {
  items: Performance[];
  nextCursor: number | null;
}

const GENRE_FILTERS = [
  { value: "", label: "전체" },
  { value: "CONCERT", label: "콘서트" },
  { value: "FESTIVAL", label: "페스티벌" },
  { value: "FANMEETING", label: "팬미팅" },
  { value: "MUSICAL", label: "뮤지컬" },
  { value: "CLASSIC", label: "클래식" },
  { value: "HIPHOP", label: "힙합/R&B" },
  { value: "TROT", label: "트로트" },
  { value: "OTHER", label: "기타" },
] as const;

export default function ConcertsScreen() {
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [genre, setGenre] = useState("");
  const insets = useSafeAreaInsets();

  const loadPerformances = useCallback(
    async (nextCursor?: number, genreFilter?: string) => {
      if (nextCursor) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      try {
        const params = new URLSearchParams({ limit: "20" });
        if (nextCursor) params.set("cursor", String(nextCursor));
        if (genreFilter) params.set("genre", genreFilter);
        const data = await api<PerformanceListResponse>(`/performances?${params}`);
        setPerformances((prev) =>
          nextCursor ? [...prev, ...data.items] : data.items
        );
        setCursor(data.nextCursor);
        setHasMore(!!data.nextCursor);
      } catch {
        // ignore
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    []
  );

  const handleEndReached = useCallback(() => {
    if (!loadingMore && hasMore && cursor) {
      loadPerformances(cursor, genre);
    }
  }, [loadingMore, hasMore, cursor, genre, loadPerformances]);

  useEffect(() => {
    setPerformances([]);
    setCursor(null);
    loadPerformances(undefined, genre);
  }, [loadPerformances, genre]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.headline}>
        <Text style={styles.headlineTitle}>Concerts</Text>
        <Text style={styles.headlineSubtitle}>오늘의 공연 라인업</Text>
      </View>

      {/* 장르 필터 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        style={styles.filterScroll}
      >
        {GENRE_FILTERS.map((g) => (
          <Pressable
            key={g.value}
            style={[
              styles.filterChip,
              genre === g.value ? styles.filterActive : styles.filterInactive,
            ]}
            onPress={() => setGenre(g.value)}
          >
            <Text
              style={[
                styles.filterText,
                genre === g.value
                  ? styles.filterTextActive
                  : styles.filterTextInactive,
              ]}
            >
              {g.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <FlatList
        data={performances}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <ConcertCard performance={item} />}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>등록된 공연이 없습니다</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          loading || loadingMore ? (
            <ActivityIndicator
              style={styles.loader}
              color={colors.onSurfaceVariant}
            />
          ) : null
        }
      />
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
  filterScroll: {
    flexGrow: 0,
    marginBottom: 24,
  },
  filterRow: {
    gap: 10,
    paddingRight: 8,
  },
  filterChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 9999,
  },
  filterActive: {
    backgroundColor: colors.primary,
  },
  filterInactive: {
    backgroundColor: colors.surfaceContainerHighest,
  },
  filterText: {
    fontSize: 14,
    fontFamily: "Inter-Medium",
  },
  filterTextActive: {
    color: colors.onPrimary,
    fontFamily: "Inter-SemiBold",
  },
  filterTextInactive: {
    color: colors.onSurface,
  },
  list: {
    paddingBottom: 40,
  },
  empty: {
    paddingVertical: 64,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter",
    color: colors.onSurfaceVariant,
  },
  loader: {
    paddingVertical: 24,
  },
});
