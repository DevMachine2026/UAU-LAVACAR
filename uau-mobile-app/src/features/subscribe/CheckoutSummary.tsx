import { Text, View } from "react-native";
import { Card } from "@/components/Card";
import { MoneyText } from "@/components/MoneyText";
import { CheckoutPreview } from "@/features/checkout/checkout.api";
import { asRecord, getNumber, getString } from "@/utils/data";

type CheckoutSummaryProps = {
  preview: CheckoutPreview;
  unitName?: string;
  vehiclePlate?: string;
};

export function CheckoutSummary({ preview, unitName, vehiclePlate }: CheckoutSummaryProps) {
  const record = asRecord(preview);
  const promotional = getNumber(record, ["promotionalCashbackUsed"], 0);
  const real = getNumber(record, ["realCashbackUsed"], 0);
  const totalCashback = getNumber(record, ["totalCashbackUsed", "cashbackUsed"], promotional + real);

  return (
    <Card>
      <View className="gap-3">
        <Text className="text-xl font-bold text-uau-black">Resumo do checkout</Text>
        <MoneyRow label="Valor do plano" value={getNumber(record, ["planAmount", "baseAmount", "amount"], 0)} />
        <MoneyRow label="Cashback promocional" value={promotional} />
        <MoneyRow label="Cashback real" value={real} />
        <MoneyRow label="Total cashback usado" value={totalCashback} />
        <MoneyRow label="Valor final gateway" value={getNumber(record, ["gatewayAmount"], 0)} />
        <Row label="Pagamento" value={getString(record, ["paymentMethod"], "-")} />
        {unitName ? <Row label="Unidade" value={unitName} /> : null}
        {vehiclePlate ? <Row label="Veiculo" value={vehiclePlate} /> : null}
      </View>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between gap-3">
      <Text className="text-sm text-uau-gray">{label}</Text>
      <Text className="text-right text-sm font-semibold text-uau-black">{value}</Text>
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
