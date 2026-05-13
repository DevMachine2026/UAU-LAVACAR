import { Text, View } from "react-native";
import { Card } from "@/components/Card";
import { DateText } from "@/components/DateText";
import { asRecord, getString } from "@/utils/data";

type FranchiseAlertCardProps = {
  alert: unknown;
};

export function FranchiseAlertCard({ alert }: FranchiseAlertCardProps) {
  const record = asRecord(alert);
  return (
    <Card>
      <View className="gap-2">
        <Text className="text-lg font-bold text-uau-black">{getString(record, ["title", "type"], "Alerta")}</Text>
        <Text className="text-sm leading-5 text-uau-gray">{getString(record, ["message", "description"], "Verifique este item.")}</Text>
        <DateText className="text-xs text-uau-gray" value={getString(record, ["createdAt", "occurredAt"])} />
      </View>
    </Card>
  );
}
