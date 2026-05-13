import { PropsWithChildren } from "react";
import { Text, View } from "react-native";

type FranchiseSectionProps = PropsWithChildren<{
  title: string;
}>;

export function FranchiseSection({ title, children }: FranchiseSectionProps) {
  return (
    <View className="gap-3">
      <Text className="text-xl font-bold text-uau-black">{title}</Text>
      <View className="gap-3">{children}</View>
    </View>
  );
}
