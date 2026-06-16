import { useEffect, useRef } from "react";
import { Animated, View, ViewStyle } from "react-native";

type SkeletonProps = {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
};

export function Skeleton({ width = "100%", height = 16, borderRadius = 8, style }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        { width: width as number, height, borderRadius, backgroundColor: "#D1D5DB", opacity },
        style,
      ]}
    />
  );
}

export function SkeletonCard() {
  return (
    <View className="rounded-lg border border-gray-200 bg-white p-4 gap-3">
      <Skeleton height={14} width="60%" />
      <Skeleton height={12} width="90%" />
      <Skeleton height={12} width="75%" />
    </View>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <View className="gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
}
