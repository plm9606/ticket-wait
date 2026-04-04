import { View, Text, Pressable, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/theme/colors";

interface Performance {
  id: string;
  title: string;
  artist: { id: string; name: string; nameEn: string | null } | null;
  venue: string | null;
  startDate: string | null;
  imageUrl: string | null;
}

function formatMonth(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("ko-KR", { month: "short" }).replace(".", "");
}

function formatDay(dateStr: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).getDate().toString().padStart(2, "0");
}

export function PopularConcertCard({ performance }: { performance: Performance }) {
  const router = useRouter();

  return (
    <Pressable
      onPress={() => router.push(`/concerts/${performance.id}`)}
      style={styles.card}
    >
      <View style={styles.imageContainer}>
        {performance.imageUrl ? (
          <Image
            source={{ uri: performance.imageUrl }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
        ) : (
          <LinearGradient
            colors={[colors.primaryContainer, colors.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        )}

        {performance.startDate && (
          <View style={styles.dateBadge}>
            <Text style={styles.dateMonth}>
              {formatMonth(performance.startDate)}
            </Text>
            <Text style={styles.dateDay}>
              {formatDay(performance.startDate)}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {performance.title}
        </Text>
        {performance.venue && (
          <View style={styles.venueRow}>
            <Ionicons
              name="location-sharp"
              size={14}
              color={colors.onSurfaceVariant}
            />
            <Text style={styles.venue}>{performance.venue}</Text>
          </View>
        )}

        {performance.artist && (
          <View style={styles.artistRow}>
            <Text style={styles.artistName}>{performance.artist.name}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  imageContainer: {
    aspectRatio: 16 / 9,
    overflow: "hidden",
  },
  dateBadge: {
    position: "absolute",
    top: 24,
    left: 24,
    width: 56,
    height: 64,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  dateMonth: {
    fontFamily: "Inter-Bold",
    fontSize: 10,
    textTransform: "uppercase",
    color: colors.onSurfaceVariant,
    marginBottom: 2,
  },
  dateDay: {
    fontFamily: "Manrope-ExtraBold",
    fontSize: 24,
    color: colors.primary,
    lineHeight: 28,
  },
  content: {
    padding: 32,
  },
  title: {
    fontFamily: "Manrope-Bold",
    fontSize: 22,
    letterSpacing: -0.3,
    color: colors.onSurface,
    marginBottom: 8,
    lineHeight: 28,
  },
  venueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  venue: {
    fontFamily: "Inter-Medium",
    fontSize: 14,
    color: colors.onSurfaceVariant,
  },
  artistRow: {
    paddingTop: 24,
    marginTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: `${colors.outlineVariant}1A`,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  artistName: {
    fontFamily: "Inter-SemiBold",
    fontSize: 12,
    color: colors.onSurfaceVariant,
  },
});
