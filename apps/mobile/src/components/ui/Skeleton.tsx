import { View, StyleSheet, ViewStyle } from "react-native";
import { colors } from "@/theme/colors";

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({
  width = "100%",
  height = 16,
  borderRadius = 4,
  style,
}: SkeletonProps) {
  return (
    <View
      style={[
        styles.skeleton,
        { width: width as any, height, borderRadius },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.gray[100],
  },
});
