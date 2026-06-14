import { Text, View } from "react-native";
import { Card } from "@/components/Card";

type ErrorStateProps = {
  title?: string;
  message?: string;
};

export function ErrorState({ title = "Não foi possível carregar", message }: ErrorStateProps) {
  return (
    <Card>
      <View className="gap-2">
        <Text className="text-lg font-semibold text-red-700">{title}</Text>
        <Text className="text-sm leading-5 text-uau-gray">
          {message ?? "Tente novamente em instantes. Se persistir, confira a conexão com a API."}
        </Text>
      </View>
    </Card>
  );
}
