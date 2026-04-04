import { useState } from "react";
import { ScrollView, View, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SearchBar } from "@/components/home/SearchBar";
import { CategoryChips } from "@/components/home/CategoryChips";
import { UpcomingForYou } from "@/components/home/UpcomingForYou";
import { PopularNearYou } from "@/components/home/PopularNearYou";
import { colors } from "@/theme/colors";

export default function HomeScreen() {
  const [genre, setGenre] = useState("");
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 100, paddingTop: insets.top }}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerInner}>
          <Text style={styles.logoText}>공연알리미</Text>
        </View>
      </View>

      <SearchBar />
      <CategoryChips genre={genre} onSelect={setGenre} />
      <UpcomingForYou genre={genre} />
      <PopularNearYou genre={genre} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerInner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logoText: {
    fontFamily: "Manrope-ExtraBold",
    fontSize: 24,
    letterSpacing: -1,
    color: colors.onSurface,
  },
});
