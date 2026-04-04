import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RecentConcerts } from "@/components/concert/RecentConcerts";
import { colors } from "@/theme/colors";
import { containerPadding } from "@/theme/spacing";

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* 히어로 섹션 */}
      <View style={[styles.hero, { paddingTop: insets.top + 60 }]}>
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>놓치지 마세요</Text>
          <Text style={styles.heroSubtitle}>
            {"좋아하는 아티스트를 구독하면\n새로운 공연 소식을 알려드립니다."}
          </Text>
          <Pressable
            style={styles.heroCta}
            onPress={() => router.push("/search")}
          >
            <Text style={styles.heroCtaText}>아티스트 구독하기</Text>
          </Pressable>
        </View>
      </View>

      {/* 서비스 소개 */}
      <View style={styles.section}>
        <View style={styles.features}>
          {[
            { icon: "◎", title: "아티스트 검색", desc: "좋아하는 가수를 검색하고 구독하세요." },
            { icon: "♡", title: "공연 소식 구독", desc: "멜론티켓, YES24, 인터파크에서 공연 정보를 수집합니다." },
            { icon: "◆", title: "푸시 알림", desc: "새 공연이 등록되면 바로 알림을 보내드립니다." },
          ].map((f) => (
            <View key={f.icon} style={styles.featureItem}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureDesc}>{f.desc}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 최근 공연 */}
      <View style={styles.recentSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>최근 등록된 공연</Text>
          <Pressable onPress={() => router.push("/concerts")}>
            <Text style={styles.seeAll}>전체 보기</Text>
          </Pressable>
        </View>
        <RecentConcerts />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  hero: {
    backgroundColor: colors.black,
    paddingBottom: 80,
  },
  heroContent: {
    paddingHorizontal: containerPadding,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: "700",
    color: colors.white,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 16,
    color: colors.gray[400],
    lineHeight: 24,
    marginTop: 16,
  },
  heroCta: {
    marginTop: 32,
    backgroundColor: colors.white,
    paddingHorizontal: 32,
    paddingVertical: 14,
    alignSelf: "flex-start",
  },
  heroCtaText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.black,
  },
  section: {
    paddingVertical: 64,
    paddingHorizontal: containerPadding,
  },
  features: {
    gap: 40,
  },
  featureItem: {},
  featureIcon: {
    fontSize: 24,
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 8,
  },
  featureDesc: {
    fontSize: 14,
    color: colors.gray[500],
    lineHeight: 20,
  },
  recentSection: {
    paddingVertical: 64,
    paddingHorizontal: containerPadding,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.gray[100],
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  seeAll: {
    fontSize: 12,
    color: colors.gray[400],
  },
});
