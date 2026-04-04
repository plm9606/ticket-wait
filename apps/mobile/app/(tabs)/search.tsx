import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "@/lib/api";
import { colors } from "@/theme/colors";
import { containerPadding } from "@/theme/spacing";

interface Artist {
  id: string;
  name: string;
  nameEn: string | null;
  imageUrl: string | null;
}

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api<Artist[]>(
          `/artists/search?q=${encodeURIComponent(query)}`
        );
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.headline}>
        <Text style={styles.headlineTitle}>Search</Text>
        <Text style={styles.headlineSubtitle}>아티스트를 찾아보세요</Text>
      </View>

      <View style={styles.inputWrap}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="아티스트 이름을 검색하세요"
          placeholderTextColor={colors.outline}
          style={styles.input}
          autoFocus
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
      </View>

      {loading && (
        <Text style={styles.loadingText}>검색 중...</Text>
      )}

      {!loading && query.trim() !== "" && results.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>검색 결과가 없습니다</Text>
        </View>
      )}

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        numColumns={3}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.gridContent}
        renderItem={({ item }) => (
          <Pressable
            style={styles.gridItem}
            onPress={() => router.push(`/artist/${item.id}`)}
          >
            <View style={styles.avatar}>
              {item.imageUrl ? (
                <Image
                  source={{ uri: item.imageUrl }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                />
              ) : (
                <Text style={styles.avatarText}>{item.name[0]}</Text>
              )}
            </View>
            <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
            {item.nameEn && (
              <Text style={styles.nameEn} numberOfLines={1}>{item.nameEn}</Text>
            )}
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingHorizontal: containerPadding,
  },
  headline: {
    paddingTop: 32,
    paddingBottom: 24,
  },
  headlineTitle: {
    fontFamily: "Manrope-ExtraBold",
    fontSize: 42,
    letterSpacing: -1,
    color: colors.primary,
  },
  headlineSubtitle: {
    fontFamily: "Inter-Medium",
    fontSize: 16,
    color: colors.onSurfaceVariant,
    marginTop: 12,
  },
  inputWrap: {
    marginBottom: 32,
  },
  input: {
    fontSize: 16,
    fontFamily: "Inter-Medium",
    backgroundColor: colors.surfaceContainerLowest,
    height: 56,
    borderRadius: 12,
    paddingHorizontal: 16,
    color: colors.onSurface,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: "Inter",
    color: colors.onSurfaceVariant,
  },
  empty: {
    paddingVertical: 64,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter",
    color: colors.onSurfaceVariant,
  },
  gridContent: {
    gap: 32,
  },
  gridRow: {
    gap: 24,
  },
  gridItem: {
    flex: 1,
    alignItems: "center",
    gap: 8,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surfaceContainerLow,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 16,
    fontFamily: "Inter-Medium",
    color: colors.onSurfaceVariant,
  },
  name: {
    fontSize: 14,
    fontFamily: "Manrope-Bold",
    color: colors.primary,
    textAlign: "center",
  },
  nameEn: {
    fontSize: 10,
    fontFamily: "Inter-Bold",
    color: colors.onSurfaceVariant,
    textTransform: "uppercase" as const,
    letterSpacing: 1.5,
    textAlign: "center",
  },
});
