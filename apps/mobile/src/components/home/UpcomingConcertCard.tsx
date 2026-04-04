import { View, Text, Pressable, StyleSheet, Dimensions } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { colors } from "@/theme/colors";

interface Concert {
  id: string;
  title: string;
  artist: { id: string; name: string; nameEn: string | null } | null;
  venue: string | null;
  startDate: string | null;
  imageUrl: string | null;
  status: string;
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

function statusLabel(status: string): string | null {
  switch (status) {
    case "ON_SALE":
      return "판매중";
    case "SOLD_OUT":
      return "매진";
    default:
      return null;
  }
}

const CARD_WIDTH = 280;

export function UpcomingConcertCard({ concert }: { concert: Concert }) {
  const router = useRouter();
  const badge = statusLabel(concert.status);

  return (
    <Pressable
      onPress={() => router.push(`/concerts/${concert.id}`)}
      style={styles.card}
    >
      <View style={styles.imageContainer}>
        {concert.imageUrl ? (
          <Image
            source={{ uri: concert.imageUrl }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
        ) : (
          <LinearGradient
            colors={[colors.primaryContainer, colors.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFill, styles.fallback]}
          >
            <Text style={styles.fallbackText} numberOfLines={3}>
              {concert.title}
            </Text>
          </LinearGradient>
        )}

        {badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}

        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.6)"]}
          style={styles.gradient}
        />

        <View style={styles.textOverlay}>
          <Text style={styles.metaText}>
            {formatDate(concert.startDate)}
            {concert.venue ? ` · ${concert.venue}` : ""}
          </Text>
          <Text style={styles.title} numberOfLines={2}>
            {concert.title}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
  },
  imageContainer: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * (5 / 4),
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: colors.surfaceContainerLow,
  },
  fallback: {
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  fallbackText: {
    fontFamily: "Manrope-Bold",
    fontSize: 18,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    lineHeight: 24,
  },
  badge: {
    position: "absolute",
    top: 16,
    left: 16,
    backgroundColor: "rgba(0,0,0,0.9)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
    zIndex: 2,
  },
  badgeText: {
    fontFamily: "Inter-Bold",
    fontSize: 10,
    color: colors.white,
    textTransform: "uppercase",
    letterSpacing: -0.2,
  },
  gradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "60%",
  },
  textOverlay: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
  },
  metaText: {
    fontFamily: "Inter-SemiBold",
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  title: {
    fontFamily: "Manrope-Bold",
    fontSize: 20,
    color: colors.white,
    lineHeight: 24,
  },
});
