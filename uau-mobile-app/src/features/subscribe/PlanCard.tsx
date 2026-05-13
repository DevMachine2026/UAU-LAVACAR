import { Pressable, Text, View } from "react-native";
import { MoneyText } from "@/components/MoneyText";
import { Plan } from "@/features/plans/plans.api";
import { asRecord, getNumber, getString } from "@/utils/data";

type PlanCardProps = {
  plan: Plan;
  selected?: boolean;
  onPress: () => void;
};

export function PlanCard({ plan, selected = false, onPress }: PlanCardProps) {
  const record = asRecord(plan);
  const coverage = getString(record, ["coverage", "scope"], "UNIT");

  return (
    <Pressable
      className={`rounded-lg border p-4 ${selected ? "border-uau-green bg-green-50" : "border-gray-200 bg-white"}`}
      onPress={onPress}
    >
      <View className="gap-3">
        <View className="flex-row justify-between gap-3">
          <View className="flex-1">
            <Text className="text-lg font-bold text-uau-black">{plan.name}</Text>
            {plan.description ? <Text className="mt-1 text-sm leading-5 text-uau-gray">{plan.description}</Text> : null}
          </View>
          <MoneyText className="text-lg font-bold text-uau-black" value={getNumber(record, ["price", "monthlyPrice", "amount"], 0)} />
        </View>
        <Text className="text-xs font-semibold text-uau-green">Abrangencia: {coverage}</Text>
        {plan.allowedDays ? <Text className="text-xs text-uau-gray">Dias: {String(plan.allowedDays)}</Text> : null}
        {plan.allowedHours ? <Text className="text-xs text-uau-gray">Horarios: {String(plan.allowedHours)}</Text> : null}
      </View>
    </Pressable>
  );
}
