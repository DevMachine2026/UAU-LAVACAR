import { Pressable, Text, View } from "react-native";

type PaymentMethodCardProps = {
  title: string;
  description: string;
  selected?: boolean;
  onPress: () => void;
};

export function PaymentMethodCard({ title, description, selected = false, onPress }: PaymentMethodCardProps) {
  return (
    <Pressable
      className={`rounded-lg border p-4 ${selected ? "border-uau-green bg-green-50" : "border-gray-200 bg-white"}`}
      onPress={onPress}
    >
      <View className="gap-1">
        <Text className="text-lg font-bold text-uau-black">{title}</Text>
        <Text className="text-sm leading-5 text-uau-gray">{description}</Text>
      </View>
    </Pressable>
  );
}
