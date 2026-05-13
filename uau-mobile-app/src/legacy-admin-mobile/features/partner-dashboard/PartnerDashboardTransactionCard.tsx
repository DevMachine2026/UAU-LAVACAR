import { Text, View } from "react-native";
import { Card } from "@/components/Card";
import { DateText } from "@/components/DateText";
import { MoneyText } from "@/components/MoneyText";
import { asRecord, getNumber, getString } from "@/utils/data";

type PartnerDashboardTransactionCardProps = {
  transaction: unknown;
};

export function PartnerDashboardTransactionCard({ transaction }: PartnerDashboardTransactionCardProps) {
  const record = asRecord(transaction);

  return (
    <Card>
      <View className="gap-3">
        <View className="flex-row justify-between gap-3">
          <View className="flex-1">
            <Text className="text-lg font-bold text-uau-black">{getString(record, ["customerName", "customer"], "Cliente")}</Text>
            <DateText className="mt-1 text-xs text-uau-gray" value={getString(record, ["createdAt"])} />
          </View>
          <Text className="text-xs font-bold text-uau-green">{getString(record, ["status"], "-")}</Text>
        </View>
        <MoneyRow label="Valor bruto" value={getNumber(record, ["grossAmount"], 0)} />
        <MoneyRow label="Cashback usado" value={getNumber(record, ["cashbackUsed"], 0)} />
        <MoneyRow label="Gateway" value={getNumber(record, ["gatewayAmount"], 0)} />
        <MoneyRow label="Cashback cliente" value={getNumber(record, ["customerCashbackAmount"], 0)} />
        <MoneyRow label="Comissao UAU" value={getNumber(record, ["uauCommissionAmount"], 0)} />
        <Row label="Metodo" value={getString(record, ["paymentMethod"], "-")} />
      </View>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between gap-3">
      <Text className="text-sm text-uau-gray">{label}</Text>
      <Text className="text-sm font-semibold text-uau-black">{value}</Text>
    </View>
  );
}

function MoneyRow({ label, value }: { label: string; value: number }) {
  return (
    <View className="flex-row justify-between gap-3">
      <Text className="text-sm text-uau-gray">{label}</Text>
      <MoneyText className="text-sm font-semibold text-uau-black" value={value} />
    </View>
  );
}
