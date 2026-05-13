import { Text, View } from "react-native";

type StepHeaderProps = {
  current: number;
  total: number;
  title: string;
  description?: string;
};

export function StepHeader({ current, total, title, description }: StepHeaderProps) {
  return (
    <View className="gap-2">
      <Text className="text-sm font-semibold text-uau-green">
        Etapa {current} de {total}
      </Text>
      <Text className="text-3xl font-bold text-uau-black">{title}</Text>
      {description ? <Text className="text-base leading-6 text-uau-gray">{description}</Text> : null}
    </View>
  );
}
