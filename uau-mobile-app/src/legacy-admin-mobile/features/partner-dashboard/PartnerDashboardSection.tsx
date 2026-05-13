import { PropsWithChildren } from "react";
import { Text, View } from "react-native";

type PartnerDashboardSectionProps = PropsWithChildren<{
  title: string;
}>;

export function PartnerDashboardSection({ title, children }: PartnerDashboardSectionProps) {
  return (
    <View className="gap-3">
      <Text className="text-xl font-bold text-uau-black">{title}</Text>
      <View className="gap-3">{children}</View>
    </View>
  );
}
