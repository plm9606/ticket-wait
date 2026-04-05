import { View, Text, Pressable, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { colors } from "@/theme/colors";

interface Performance {
  id: number;
  title: string;
  artists?: Array<{ id: number; name: string; nameEn: string | null }> | null;
  venue: { id: number; name: string } | null;
  startDate: string | null;
  source: string;
  imageUrl: string | null;
  genre?: string;
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
  return d.toLocaleDateString("ko-KR", { month: "long", day: "numeric" });
}

const GENRE_LABELS: Record<string, string> = {
  CONCERT: "콘서트",
  FESTIVAL: "페스티벌",
  FANMEETING: "팬미팅",
  MUSICAL: "뮤지컬",
  CLASSIC: "클래식",
  HIPHOP: "힙합/R&B",
  TROT: "트로트",
  OTHER: "기타",
};

export function ConcertCard({ performance }: { performance: Performance }) {
  const router = useRouter();

  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push(`/concerts/${performance.id}`)}
    >
      {performance.imageUrl && (
        <View style={styles.thumbnail}>
          <Image
            source={{ uri: performance.imageUrl }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
        </View>
      )}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {performance.title}
        </Text>
        {performance.artists?.[0] && (
          <Text style={styles.artist}>{performance.artists[0].name}</Text>
        )}
        <View style={styles.metaRow}>
          {performance.venue && (
            <Text style={styles.metaText}>{performance.venue.name}</Text>
          )}
          {performance.startDate && (
            <Text style={styles.metaText}>{formatDate(performance.startDate)}</Text>
          )}
        </View>
        <View style={styles.tagRow}>
          <Text style={styles.sourceText}>{sourceLabel(performance.source)}</Text>
          {performance.genre && performance.genre !== "CONCERT" && (
            <View style={styles.genreBadge}>
              <Text style={styles.genreText}>
                {GENRE_LABELS[performance.genre] ?? performance.genre}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    gap: 16,
    padding: 12,
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 12,
  },
  thumbnail: {
    width: 64,
    height: 64,
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 8,
    overflow: "hidden",
  },
  content: {
    flex: 1,
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
    fontFamily: "Inter-Medium",
    color: colors.onSurfaceVariant,
    marginTop: 4,
  },
  metaRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  metaText: {
    fontSize: 12,
    fontFamily: "Inter",
    color: colors.onSurfaceVariant,
  },
  tagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  sourceText: {
    fontSize: 10,
    fontFamily: "Inter-Bold",
    color: colors.onSurfaceVariant,
    textTransform: "uppercase" as const,
    letterSpacing: 1.5,
  },
  genreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: colors.secondaryContainer,
    borderRadius: 9999,
  },
  genreText: {
    fontSize: 10,
    fontFamily: "Inter-Bold",
    color: colors.onSecondaryContainer,
  },
});
