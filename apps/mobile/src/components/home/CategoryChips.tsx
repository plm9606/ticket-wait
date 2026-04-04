import { ScrollView, Pressable, Text, StyleSheet } from "react-native";
import { colors } from "@/theme/colors";

const GENRE_FILTERS = [
  { label: "전체", value: "" },
  { label: "콘서트", value: "CONCERT" },
  { label: "페스티벌", value: "FESTIVAL" },
  { label: "팬미팅", value: "FANMEETING" },
  { label: "뮤지컬", value: "MUSICAL" },
  { label: "클래식", value: "CLASSIC" },
  { label: "힙합/R&B", value: "HIPHOP" },
  { label: "트로트", value: "TROT" },
];

interface CategoryChipsProps {
  genre: string;
  onSelect: (genre: string) => void;
}

export function CategoryChips({ genre, onSelect }: CategoryChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
      style={styles.scroll}
    >
      {GENRE_FILTERS.map((filter) => {
        const isActive = genre === filter.value;
        return (
          <Pressable
            key={filter.value}
            onPress={() => onSelect(filter.value)}
            style={[styles.chip, isActive ? styles.chipActive : styles.chipInactive]}
          >
            <Text
              style={[
                styles.chipText,
                isActive ? styles.chipTextActive : styles.chipTextInactive,
              ]}
            >
              {filter.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    marginBottom: 40,
  },
  container: {
    paddingHorizontal: 24,
    gap: 12,
  },
  chip: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 9999,
  },
  chipActive: {
    backgroundColor: colors.primary,
  },
  chipInactive: {
    backgroundColor: colors.surfaceContainerHighest,
  },
  chipText: {
    fontFamily: "Inter-Medium",
    fontSize: 14,
  },
  chipTextActive: {
    fontFamily: "Inter-SemiBold",
    color: colors.onPrimary,
    letterSpacing: 0.5,
  },
  chipTextInactive: {
    color: colors.onSurface,
  },
});
