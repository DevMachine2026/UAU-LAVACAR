import { Text, View } from "react-native";
import { Card } from "@/components/Card";
import { Partner } from "@/features/partners/partners.api";
import { asRecord, getNumber } from "@/utils/data";

type PartnerRuleCardProps = {
  partner: Partner;
};

export function PartnerRuleCard({ partner }: PartnerRuleCardProps) {
  const record = asRecord(partner);

  return (
    <Card>
      <View className="gap-3">
        <Text className="text-xl font-bold text-uau-black">Regras de cashback</Text>
        <Rule label="Cashback gerado" value={`${getNumber(record, ["generatedCashbackPercent"], 0)}%`} />
        <Rule label="Cashback cliente" value={`${getNumber(record, ["customerCashbackPercent"], 0)}%`} />
        <Rule label="Comissao UAU" value={`${getNumber(record, ["uauCommissionPercent"], 0)}%`} />
        <Rule label="Limite aceito" value={`${getNumber(record, ["acceptedCashbackLimitPercent"], 0)}%`} />
        <Text className="text-sm leading-5 text-uau-gray">
          Cashback usado no parceiro funciona como desconto do parceiro e nao gera divida da UAU.
        </Text>
        <Text className="text-sm leading-5 text-uau-gray">
          Novo cashback incide somente sobre o valor pago via PIX/cartao.
        </Text>
      </View>
    </Card>
  );
}

function Rule({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between gap-3">
      <Text className="text-sm text-uau-gray">{label}</Text>
      <Text className="text-sm font-bold text-uau-black">{value}</Text>
    </View>
  );
}
