import { Text, View } from "react-native";
import { Card } from "@/components/Card";
import { DateText } from "@/components/DateText";
import { OperationalShift } from "@/features/operator/operator.api";
import { getNestedRecord, getString, asRecord } from "@/utils/data";

type OperatorShiftCardProps = {
  shift: OperationalShift;
};

export function OperatorShiftCard({ shift }: OperatorShiftCardProps) {
  const record = asRecord(shift);
  const unit = getNestedRecord(record, ["unit"]);

  return (
    <Card>
      <View className="gap-3">
        <View className="flex-row justify-between gap-3">
          <View className="flex-1">
            <Text className="text-xl font-bold text-uau-black">Expediente aberto</Text>
            <Text className="mt-1 text-sm text-uau-gray">{getString(unit, ["name"], `Unidade ${shift.unitId}`)}</Text>
          </View>
          <Text className="text-xs font-bold text-uau-green">{shift.status}</Text>
        </View>
        <View className="flex-row justify-between gap-3">
          <Text className="text-sm text-uau-gray">Abertura</Text>
          <DateText className="text-sm font-semibold text-uau-black" value={shift.openedAt} />
        </View>
        {shift.openingNotes ? <Text className="text-sm leading-5 text-uau-gray">{shift.openingNotes}</Text> : null}
      </View>
    </Card>
  );
}
