import { useState, useEffect } from "react";
import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { api } from "@/lib/api";
import { colors } from "@/theme/colors";
import { UpcomingConcertCard } from "./UpcomingConcertCard";

interface Performance {
  id: number;
  title: string;
  artist: { id: number; name: string; nameEn: string | null } | null;
  venue: string | null;
  startDate: string | null;
  imageUrl: string | null;
  status: string;
  genre: string;
}

interface UpcomingForYouProps {
  genre: string;
}

export function UpcomingForYou({ genre }: UpcomingForYouProps) {
  const router = useRouter();
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const genreParam = genre ? `&genre=${genre}` : "";
        const data = await api<{ items: Performance[] }>(
          `/performances?limit=10${genreParam}`
        );
        setPerformances(data.items);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [genre]);

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>나를 위한 공연</Text>
          <Text style={styles.subtitle}>최근 등록된 공연</Text>
        </View>
        <Pressable onPress={() => router.push("/concerts")}>
          <Text style={styles.viewAll}>전체 보기</Text>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.skeletonRow}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={styles.skeletonCard} />
          ))}
        </View>
      ) : performances.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>공연이 없습니다</Text>
        </View>
      ) : (
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={performances}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <UpcomingConcertCard performance={item} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 48,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  title: {
    fontFamily: "Manrope-ExtraBold",
    fontSize: 28,
    letterSpacing: -0.5,
    color: colors.onSurface,
    lineHeight: 32,
  },
  subtitle: {
    fontFamily: "Inter-Medium",
    fontSize: 14,
    color: colors.onSurfaceVariant,
    marginTop: 8,
  },
  viewAll: {
    fontFamily: "Inter-Bold",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 2,
    color: colors.primary,
  },
  list: {
    paddingHorizontal: 24,
    gap: 24,
  },
  skeletonRow: {
    flexDirection: "row",
    paddingHorizontal: 24,
    gap: 24,
  },
  skeletonCard: {
    width: 280,
    height: 350,
    borderRadius: 16,
    backgroundColor: colors.surfaceContainerLow,
  },
  empty: {
    paddingVertical: 48,
    alignItems: "center",
  },
  emptyText: {
    fontFamily: "Inter",
    fontSize: 14,
    color: colors.onSurfaceVariant,
  },
});
