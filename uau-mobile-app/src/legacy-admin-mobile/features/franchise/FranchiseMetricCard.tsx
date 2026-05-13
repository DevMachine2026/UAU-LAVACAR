import { Text, View } from "react-native";
import { Card } from "@/components/Card";
import { MoneyText } from "@/components/MoneyText";

type FranchiseMetricCardProps = {
  label: string;
  value: number | string;
  money?: boolean;
};

export function FranchiseMetricCard({ label, value, money = false }: FranchiseMetricCardProps) {
  return (
    <Card>
      <View className="gap-2">
        <Text className="text-sm text-uau-gray">{label}</Text>
        {money ? (
          <MoneyText className="text-2xl font-bold text-uau-black" value={value} />
        ) : (
          <Text className="text-2xl font-bold text-uau-black">{value}</Text>
        )}
      </View>
    </Card>
  );
}
