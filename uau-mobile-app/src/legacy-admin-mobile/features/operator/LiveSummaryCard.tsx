import { Text, View } from "react-native";
import { Card } from "@/components/Card";
import { MoneyText } from "@/components/MoneyText";
import { LiveSummary } from "@/features/operator/operator.api";
import { asRecord, getNestedRecord, getNumber } from "@/utils/data";

type LiveSummaryCardProps = {
  summary?: LiveSummary;
};

export function LiveSummaryCard({ summary }: LiveSummaryCardProps) {
  const record = asRecord(summary);
  const totalByType = getNestedRecord(record, ["totalByType", "productionByType"]);
  const totalByPayment = getNestedRecord(record, ["totalByPayment"]);

  return (
    <Card>
      <View className="gap-4">
        <Text className="text-xl font-bold text-uau-black">Contador em tempo real</Text>
        <View className="flex-row flex-wrap gap-3">
          <Metric label="Total" value={getNumber(record, ["totalAttendances"], 0)} />
          <Metric label="Plano" value={getNumber(totalByType, ["PLAN"], 0)} />
          <Metric label="Avulso" value={getNumber(totalByType, ["AVULSO"], 0)} />
          <Metric label="Cortesia" value={getNumber(totalByType, ["COURTESY"], 0)} />
          <Metric label="Parceiro" value={getNumber(totalByType, ["PARTNER"], 0)} />
          <Metric label="Bloqueado" value={getNumber(totalByType, ["BLOCKED"], 0)} />
          <Metric label="Desconhecido" value={getNumber(totalByType, ["UNKNOWN"], 0)} />
        </View>
        <View className="gap-2">
          <MoneyRow label="Total PIX" value={getNumber(totalByPayment, ["PIX"], 0)} />
          <MoneyRow label="Total cartao" value={getNumber(totalByPayment, ["CREDIT_CARD"], 0)} />
          <MoneyRow label="Total cashback" value={getNumber(totalByPayment, ["CASHBACK"], 0)} />
          <MoneyRow label="Bruto" value={getNumber(record, ["grossAmount"], 0)} />
          <MoneyRow label="Liquido" value={getNumber(record, ["netAmount"], 0)} />
        </View>
      </View>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <View className="min-w-[30%] flex-1 rounded-lg bg-uau-light p-3">
      <Text className="text-xs text-uau-gray">{label}</Text>
      <Text className="mt-1 text-2xl font-bold text-uau-black">{value}</Text>
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
