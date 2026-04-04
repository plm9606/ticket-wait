import { View, StyleSheet, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { containerPadding } from "@/theme/spacing";

interface ContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function Container({ children, style }: ContainerProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: containerPadding,
  },
});
