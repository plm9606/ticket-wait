import { useState, useEffect, useRef } from "react";
import { View, Text, Pressable, StyleSheet, Animated } from "react-native";
import { useRouter } from "expo-router";
import { api } from "@/lib/api";
import { colors } from "@/theme/colors";
import { PopularConcertCard } from "./PopularConcertCard";

interface Performance {
  id: number;
  title: string;
  artist: { id: number; name: string; nameEn: string | null } | null;
  venue: string | null;
  startDate: string | null;
  imageUrl: string | null;
  genre: string;
  status: string;
}

interface PopularNearYouProps {
  genre: string;
}

export function PopularNearYou({ genre }: PopularNearYouProps) {
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const genreParam = genre ? `&genre=${genre}` : "";
        const data = await api<{ items: Performance[] }>(
          `/performances?limit=4${genreParam}`
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
          <Text style={styles.title}>인기 공연</Text>
          <Text style={styles.subtitle}>최근 인기 있는 공연</Text>
        </View>
        <View style={styles.liveIndicator}>
          <PulseDot />
          <Text style={styles.liveText}>실시간</Text>
        </View>
      </View>

      <View style={styles.cards}>
        {loading
          ? [0, 1].map((i) => (
              <View key={i} style={styles.skeletonCard}>
                <View style={styles.skeletonImage} />
                <View style={styles.skeletonContent}>
                  <View style={styles.skeletonTitle} />
                  <View style={styles.skeletonSubtitle} />
                </View>
              </View>
            ))
          : performances.map((performance) => (
              <PopularConcertCard key={performance.id} performance={performance} />
            ))}
      </View>
    </View>
  );
}

function PulseDot() {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.8,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  return (
    <View style={styles.dotContainer}>
      <Animated.View
        style={[
          styles.dotPing,
          {
            transform: [{ scale: pulseAnim }],
            opacity: pulseAnim.interpolate({
              inputRange: [1, 1.8],
              outputRange: [0.75, 0],
            }),
          },
        ]}
      />
      <View style={styles.dot} />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: colors.surfaceContainerLow,
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 32,
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
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  liveText: {
    fontFamily: "Inter-Bold",
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 2,
    color: colors.onSurfaceVariant,
  },
  cards: {
    gap: 40,
  },
  dotContainer: {
    width: 8,
    height: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  dotPing: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.tertiary,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.tertiary,
  },
  skeletonCard: {
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: 24,
    overflow: "hidden",
  },
  skeletonImage: {
    aspectRatio: 16 / 9,
    backgroundColor: colors.surfaceContainer,
  },
  skeletonContent: {
    padding: 32,
    gap: 16,
  },
  skeletonTitle: {
    height: 24,
    backgroundColor: colors.surfaceContainer,
    borderRadius: 8,
    width: "75%",
  },
  skeletonSubtitle: {
    height: 16,
    backgroundColor: colors.surfaceContainer,
    borderRadius: 8,
    width: "50%",
  },
});
