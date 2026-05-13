import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { Partner } from "@/features/partners/partners.api";
import { asRecord, getNestedRecord, getNumber, getString } from "@/utils/data";

type PartnerCardProps = {
  partner: Partner;
};

export function PartnerCard({ partner }: PartnerCardProps) {
  const record = asRecord(partner);
  const city = getNestedRecord(record, ["city"]);
  const unit = getNestedRecord(record, ["unit"]);
  const cityName = getString(record, ["cityName"]) || getString(city, ["name"]);
  const unitName = getString(record, ["unitName"]) || getString(unit, ["name"]);

  return (
    <Pressable
      className="rounded-lg border border-gray-200 bg-white p-4"
      onPress={() => router.push(`/partners/${partner.id}`)}
    >
      <View className="gap-2">
        <View className="flex-row justify-between gap-3">
          <View className="flex-1">
            <Text className="text-lg font-bold text-uau-black">{partner.name}</Text>
            <Text className="text-sm text-uau-gray">{getString(record, ["category"], "Parceiro local")}</Text>
          </View>
          <Text className={`text-xs font-bold ${partner.isActive === false ? "text-red-600" : "text-uau-green"}`}>
            {partner.isActive === false ? "Inativo" : "Ativo"}
          </Text>
        </View>
        {cityName || unitName ? (
          <Text className="text-sm text-uau-gray">{[cityName, unitName].filter(Boolean).join(" - ")}</Text>
        ) : null}
        <View className="flex-row justify-between gap-3">
          <Text className="text-xs font-semibold text-uau-green">
            Cashback {getNumber(record, ["generatedCashbackPercent"], 0)}%
          </Text>
          <Text className="text-xs font-semibold text-uau-gray">
            Aceita ate {getNumber(record, ["acceptedCashbackLimitPercent"], 0)}%
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
