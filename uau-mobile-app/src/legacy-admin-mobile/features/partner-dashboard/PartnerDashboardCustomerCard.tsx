import { Text, View } from "react-native";
import { Card } from "@/components/Card";
import { DateText } from "@/components/DateText";
import { MoneyText } from "@/components/MoneyText";
import { asRecord, getNumber, getString } from "@/utils/data";

type PartnerDashboardCustomerCardProps = {
  customer: unknown;
};

export function PartnerDashboardCustomerCard({ customer }: PartnerDashboardCustomerCardProps) {
  const record = asRecord(customer);

  return (
    <Card>
      <View className="gap-2">
        <Text className="text-lg font-bold text-uau-black">{getString(record, ["name", "customerName"], "Cliente")}</Text>
        <Text className="text-sm text-uau-gray">{getString(record, ["phone", "maskedPhone"], "Telefone nao informado")}</Text>
        <Text className="text-sm text-uau-gray">Compras: {getNumber(record, ["totalPurchases"], 0)}</Text>
        <View className="flex-row justify-between gap-3">
          <Text className="text-sm text-uau-gray">Total gasto</Text>
          <MoneyText className="text-sm font-semibold text-uau-black" value={getNumber(record, ["totalSpent"], 0)} />
        </View>
        <DateText className="text-xs text-uau-gray" value={getString(record, ["lastPurchaseAt"])} />
      </View>
    </Card>
  );
}
