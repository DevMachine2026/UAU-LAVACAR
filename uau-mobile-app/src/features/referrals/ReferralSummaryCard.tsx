import { Text, View } from "react-native";
import { Card } from "@/components/Card";
import { MoneyText } from "@/components/MoneyText";
import { getLineEarnings, getLineTotal } from "@/features/referrals/referrals.utils";

type ReferralSummaryCardProps = {
  network: unknown;
};

export function ReferralSummaryCard({ network }: ReferralSummaryCardProps) {
  return (
    <Card>
      <View className="gap-4">
        <Text className="text-xl font-bold text-uau-black">Resumo da rede</Text>
        {[1, 2, 3].map((line) => (
          <View className="flex-row justify-between gap-3" key={line}>
            <View>
              <Text className="font-semibold text-uau-black">Linha {line}</Text>
              <Text className="text-sm text-uau-gray">{getLineTotal(network, line as 1 | 2 | 3)} pessoas</Text>
            </View>
            <MoneyText className="font-bold text-uau-black" value={getLineEarnings(network, line as 1 | 2 | 3)} />
          </View>
        ))}
      </View>
    </Card>
  );
}
