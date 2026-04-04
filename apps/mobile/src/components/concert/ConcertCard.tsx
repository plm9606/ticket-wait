import { View, Text, Pressable, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { colors } from "@/theme/colors";

interface Concert {
  id: string;
  title: string;
  artist?: { id: string; name: string; nameEn: string | null } | null;
  venue: string | null;
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

export function ConcertCard({ concert }: { concert: Concert }) {
  const router = useRouter();

  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push(`/concerts/${concert.id}`)}
    >
      {concert.imageUrl && (
        <View style={styles.thumbnail}>
          <Image
            source={{ uri: concert.imageUrl }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
        </View>
      )}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {concert.title}
        </Text>
        {concert.artist && (
          <Text style={styles.artist}>{concert.artist.name}</Text>
        )}
        <View style={styles.metaRow}>
          {concert.venue && (
            <Text style={styles.metaText}>{concert.venue}</Text>
          )}
          {concert.startDate && (
            <Text style={styles.metaText}>{formatDate(concert.startDate)}</Text>
          )}
        </View>
        <View style={styles.tagRow}>
          <Text style={styles.sourceText}>{sourceLabel(concert.source)}</Text>
          {concert.genre && concert.genre !== "CONCERT" && (
            <View style={styles.genreBadge}>
              <Text style={styles.genreText}>
                {GENRE_LABELS[concert.genre] ?? concert.genre}
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
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.gray[100],
  },
  thumbnail: {
    width: 64,
    height: 88,
    backgroundColor: colors.gray[50],
    overflow: "hidden",
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 18,
  },
  artist: {
    fontSize: 12,
    color: colors.gray[500],
    marginTop: 4,
  },
  metaRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  metaText: {
    fontSize: 12,
    color: colors.gray[400],
  },
  tagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  sourceText: {
    fontSize: 10,
    color: colors.gray[300],
  },
  genreBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: colors.gray[100],
  },
  genreText: {
    fontSize: 10,
    color: colors.gray[500],
  },
});
