import { Text, View } from "react-native";
import { Card } from "@/components/Card";

type EmptyStateProps = {
  title: string;
  description: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <Card>
      <View className="gap-2">
        <Text className="text-lg font-semibold text-uau-black">{title}</Text>
        <Text className="text-sm leading-5 text-uau-gray">{description}</Text>
      </View>
    </Card>
  );
}
