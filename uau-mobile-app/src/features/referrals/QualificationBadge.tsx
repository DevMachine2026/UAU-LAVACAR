import { Text, View } from "react-native";

type QualificationBadgeProps = {
  qualified: boolean;
  label?: string;
};

export function QualificationBadge({ qualified, label }: QualificationBadgeProps) {
  return (
    <View className={`self-start rounded-full px-3 py-1 ${qualified ? "bg-green-100" : "bg-yellow-100"}`}>
      <Text className={`text-xs font-bold ${qualified ? "text-uau-green" : "text-yellow-700"}`}>
        {label ?? (qualified ? "Qualificado" : "Nao qualificado")}
      </Text>
    </View>
  );
}
