import { PropsWithChildren } from "react";
import { View } from "react-native";

export function Card({ children }: PropsWithChildren) {
  return <View className="rounded-lg border border-gray-200 bg-white p-4">{children}</View>;
}
