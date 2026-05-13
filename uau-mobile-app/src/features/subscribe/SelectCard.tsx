import { Pressable, Text, View } from "react-native";

type SelectCardProps = {
  title: string;
  description?: string;
  selected?: boolean;
  onPress: () => void;
};

export function SelectCard({ title, description, selected = false, onPress }: SelectCardProps) {
  return (
    <Pressable
      className={`rounded-lg border p-4 ${selected ? "border-uau-green bg-green-50" : "border-gray-200 bg-white"}`}
      onPress={onPress}
    >
      <View className="gap-1">
        <Text className="text-base font-semibold text-uau-black">{title}</Text>
        {description ? <Text className="text-sm leading-5 text-uau-gray">{description}</Text> : null}
      </View>
    </Pressable>
  );
}
