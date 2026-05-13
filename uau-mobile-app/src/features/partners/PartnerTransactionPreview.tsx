import { Text, View } from "react-native";
import { Card } from "@/components/Card";
import { MoneyText } from "@/components/MoneyText";
import { PartnerTransactionPreview as Preview } from "@/features/partners/partners.api";
import { asRecord, getNumber, getString } from "@/utils/data";

type PartnerTransactionPreviewProps = {
  preview: Preview;
};

export function PartnerTransactionPreview({ preview }: PartnerTransactionPreviewProps) {
  const record = asRecord(preview);

  return (
    <Card>
      <View className="gap-3">
        <Text className="text-xl font-bold text-uau-black">Resultado da simulacao</Text>
        <MoneyRow label="Valor bruto" value={getNumber(record, ["grossAmount"], 0)} />
        <MoneyRow label="Cashback usado" value={getNumber(record, ["cashbackUsed"], 0)} />
        <MoneyRow label="Valor via gateway" value={getNumber(record, ["gatewayAmount"], 0)} />
        <MoneyRow
          label="Cashback novo"
          value={getNumber(record, ["customerCashbackAmount", "generatedCashbackAmount"], 0)}
        />
        <MoneyRow label="Comissao UAU" value={getNumber(record, ["uauCommissionAmount"], 0)} />
        <View className="flex-row justify-between gap-3">
          <Text className="text-sm text-uau-gray">Pagamento</Text>
          <Text className="text-sm font-semibold text-uau-black">{getString(record, ["paymentMethod"], "-")}</Text>
        </View>
      </View>
    </Card>
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
