import { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { api } from "@/lib/api";
import { colors } from "@/theme/colors";

interface Concert {
  id: string;
  title: string;
  artist: { id: string; name: string; nameEn: string | null } | null;
  venue: string | null;
  startDate: string | null;
  source: string;
  imageUrl: string | null;
}

function sourceLabel(source: string) {
  switch (source) {
    case "INTERPARK": return "인터파크";
    case "YES24": return "YES24";
    case "MELON": return "멜론티켓";
    default: return source;
  }
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

const COLUMN_GAP = 12;
const COLUMNS = 2;
const screenWidth = Dimensions.get("window").width;
const itemWidth = (screenWidth - 40 - COLUMN_GAP * (COLUMNS - 1)) / COLUMNS;

export function RecentConcerts() {
  const [concerts, setConcerts] = useState<Concert[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      try {
        const data = await api<{ items: Concert[] }>("/concerts?limit=8");
        setConcerts(data.items);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <View style={styles.grid}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={styles.skeletonItem}>
            <View style={[styles.posterSkeleton, { width: itemWidth }]} />
            <View style={styles.titleSkeleton} />
            <View style={styles.subtitleSkeleton} />
          </View>
        ))}
      </View>
    );
  }

  if (concerts.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>아직 등록된 공연이 없습니다</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={concerts}
      numColumns={2}
      scrollEnabled={false}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.list}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <Pressable
          style={[styles.item, { width: itemWidth }]}
          onPress={() => router.push(`/concerts/${item.id}`)}
        >
          <View style={[styles.poster, { width: itemWidth, height: itemWidth * (4 / 3) }]}>
            {item.imageUrl ? (
              <Image
                source={{ uri: item.imageUrl }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
              />
            ) : (
              <Text style={styles.noImage}>No Image</Text>
            )}
          </View>
          <View style={styles.info}>
            <Text style={styles.title} numberOfLines={2}>
              {item.title}
            </Text>
            {item.artist && (
              <Text style={styles.artist}>{item.artist.name}</Text>
            )}
            <View style={styles.meta}>
              <Text style={styles.metaText}>{sourceLabel(item.source)}</Text>
              {item.startDate && (
                <Text style={styles.metaText}>
                  {" · "}
                  {formatDate(item.startDate)}
                </Text>
              )}
            </View>
          </View>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: COLUMN_GAP,
  },
  row: {
    gap: COLUMN_GAP,
  },
  list: {
    gap: COLUMN_GAP,
  },
  item: {},
  poster: {
    backgroundColor: colors.gray[50],
    borderRadius: 6,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  noImage: {
    fontSize: 11,
    color: colors.gray[200],
  },
  info: {
    marginTop: 8,
  },
  title: {
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 16,
  },
  artist: {
    fontSize: 10,
    color: colors.gray[500],
    marginTop: 2,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  metaText: {
    fontSize: 10,
    color: colors.gray[300],
  },
  skeletonItem: {
    width: itemWidth,
  },
  posterSkeleton: {
    height: itemWidth * (4 / 3),
    backgroundColor: colors.gray[100],
    borderRadius: 6,
  },
  titleSkeleton: {
    height: 12,
    backgroundColor: colors.gray[100],
    borderRadius: 4,
    marginTop: 8,
    width: "75%",
  },
  subtitleSkeleton: {
    height: 10,
    backgroundColor: colors.gray[100],
    borderRadius: 4,
    marginTop: 4,
    width: "50%",
  },
  empty: {
    paddingVertical: 48,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: colors.gray[400],
  },
});
