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
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <View style={styles.inputWrap}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="아티스트 이름을 검색하세요"
          placeholderTextColor={colors.gray[300]}
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
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
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
            <View>
              <Text style={styles.name}>{item.name}</Text>
              {item.nameEn && (
                <Text style={styles.nameEn}>{item.nameEn}</Text>
              )}
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    paddingHorizontal: containerPadding,
  },
  inputWrap: {
    marginBottom: 24,
  },
  input: {
    fontSize: 24,
    fontWeight: "300",
    borderBottomWidth: 2,
    borderBottomColor: colors.black,
    paddingBottom: 12,
    color: colors.gray[900],
  },
  loadingText: {
    fontSize: 14,
    color: colors.gray[400],
  },
  empty: {
    paddingVertical: 64,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: colors.gray[400],
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.gray[100],
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.gray[100],
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 14,
    color: colors.gray[400],
  },
  name: {
    fontSize: 14,
    fontWeight: "500",
  },
  nameEn: {
    fontSize: 12,
    color: colors.gray[400],
    marginTop: 2,
  },
});
