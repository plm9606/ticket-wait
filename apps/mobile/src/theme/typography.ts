export const fontFamily = "Pretendard";

export const fontSize = {
  "2xs": 10,
  xs: 11,
  sm: 12,
  md: 14,
  base: 15,
  lg: 16,
  xl: 18,
  "2xl": 20,
  "3xl": 24,
  "4xl": 30,
  "5xl": 36,
} as const;

export const fontWeight = {
  light: "300" as const,
  normal: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
};

export const letterSpacing = {
  tight: -0.2,
  normal: 0,
  wide: 0.5,
  wider: 1,
  widest: 2,
} as const;
