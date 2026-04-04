import { View, Pressable, Text, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/theme/colors";

export function SearchBar() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Pressable style={styles.searchBox} onPress={() => router.push("/search")}>
        <Ionicons
          name="search"
          size={20}
          color={colors.onSurfaceVariant}
          style={styles.icon}
        />
        <Text style={styles.placeholder}>아티스트, 공연장을 검색하세요</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceContainerLowest,
    height: 56,
    borderRadius: 12,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  icon: {
    marginRight: 12,
  },
  placeholder: {
    fontFamily: "Inter-Medium",
    fontSize: 15,
    color: `${colors.onSurfaceVariant}80`,
  },
});
