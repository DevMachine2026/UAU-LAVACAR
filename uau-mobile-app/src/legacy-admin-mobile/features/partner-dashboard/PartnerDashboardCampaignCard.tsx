import { Text, View } from "react-native";
import { Card } from "@/components/Card";
import { DateText } from "@/components/DateText";
import { asRecord, getNumber, getString } from "@/utils/data";

type PartnerDashboardCampaignCardProps = {
  campaign: unknown;
};

export function PartnerDashboardCampaignCard({ campaign }: PartnerDashboardCampaignCardProps) {
  const record = asRecord(campaign);

  return (
    <Card>
      <View className="gap-2">
        <View className="flex-row justify-between gap-3">
          <Text className="flex-1 text-lg font-bold text-uau-black">{getString(record, ["name", "title"], "Campanha")}</Text>
          <Text className={`text-xs font-bold ${record.isActive === false ? "text-red-600" : "text-uau-green"}`}>
            {record.isActive === false ? "Inativa" : "Ativa"}
          </Text>
        </View>
        <Text className="text-sm text-uau-gray">Cashback gerado: {getNumber(record, ["generatedCashbackPercent"], 0)}%</Text>
        <Text className="text-sm text-uau-gray">Limite aceito: {getNumber(record, ["acceptedCashbackLimitPercent"], 0)}%</Text>
        <Text className="text-sm text-uau-gray">Dias/horarios: {getString(record, ["validDays"], "-")} {getString(record, ["startTime"])} {getString(record, ["endTime"])}</Text>
        <DateText className="text-xs text-uau-gray" value={getString(record, ["endsAt"])} />
      </View>
    </Card>
  );
}
