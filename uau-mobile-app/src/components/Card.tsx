import { PropsWithChildren } from "react";
import { Pressable, View } from "react-native";

type CardProps = PropsWithChildren<{
  onPress?: () => void;
}>;

export function Card({ children, onPress }: CardProps) {
  if (onPress) {
    return (
      <Pressable
        className="rounded-lg border border-gray-200 bg-white p-4"
        onPress={onPress}
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
      >
        {children}
      </Pressable>
    );
  }

  return <View className="rounded-lg border border-gray-200 bg-white p-4">{children}</View>;
}
