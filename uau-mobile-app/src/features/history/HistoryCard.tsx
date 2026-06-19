import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { Card } from "@/components/Card";
import { DateText } from "@/components/DateText";
import { MoneyText } from "@/components/MoneyText";
import { asRecord, getNestedRecord, getNumber, getString } from "@/utils/data";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

function getAttendanceTypeInfo(type: string): { label: string; icon: IoniconName } {
  switch (type?.toUpperCase()) {
    case "MANUAL": return { label: "Check-in manual",    icon: "person-outline" };
    case "ANPR":   return { label: "Câmera automática",  icon: "camera-outline" };
    default:       return { label: type || "-",           icon: "checkmark-circle-outline" };
  }
}

type HistoryCardProps = {
  item: unknown;
};

export function HistoryCard({ item }: HistoryCardProps) {
  const record = asRecord(item);
  const unit = getNestedRecord(record, ["unit"]);

  return (
    <Card>
      <View className="gap-3">
        <View className="flex-row justify-between gap-3">
          <View className="flex-1">
            <Text className="text-lg font-bold text-uau-black">
              {getString(record, ["plate", "vehiclePlate"], "Atendimento")}
            </Text>
            <Text className="mt-1 text-sm text-uau-gray">{getString(unit, ["name"], "Unidade nao informada")}</Text>
          </View>
          <Text className="text-xs font-bold text-uau-green">{getString(record, ["status"], "-")}</Text>
        </View>

        <View className="gap-2">
          {(() => {
            const typeVal = getString(record, ["type"], "");
            const { label, icon } = getAttendanceTypeInfo(typeVal);
            return (
              <View className="flex-row items-center gap-1.5">
                <Ionicons name={icon} size={14} color="#667085" />
                <Text className="text-sm text-uau-gray">{label}</Text>
              </View>
            );
          })()}
          <Row label="Origem" value={getString(record, ["source"], "-")} />
          <View className="flex-row justify-between gap-3">
            <Text className="text-sm text-uau-gray">Entrada</Text>
            <DateText className="text-sm font-semibold text-uau-black" value={getString(record, ["entryAt"])} />
          </View>
          <View className="flex-row justify-between gap-3">
            <Text className="text-sm text-uau-gray">Saida</Text>
            <DateText className="text-sm font-semibold text-uau-black" value={getString(record, ["exitAt"])} />
          </View>
          <MoneyRow label="Valor pago" value={getNumber(record, ["amountPaid"], 0)} />
          <MoneyRow label="Cashback usado" value={getNumber(record, ["cashbackUsed"], 0)} />
        </View>

        {getString(record, ["notes"]) ? <Text className="text-sm leading-5 text-uau-gray">{getString(record, ["notes"])}</Text> : null}
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
