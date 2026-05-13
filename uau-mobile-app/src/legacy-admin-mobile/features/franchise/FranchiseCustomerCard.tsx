import { Text, View } from "react-native";
import { Card } from "@/components/Card";
import { MoneyText } from "@/components/MoneyText";
import { asArray, asRecord, getNestedRecord, getNumber, getString } from "@/utils/data";

type FranchiseCustomerCardProps = {
  customer: unknown;
};

export function FranchiseCustomerCard({ customer }: FranchiseCustomerCardProps) {
  const record = asRecord(customer);
  const wallet = getNestedRecord(record, ["wallet", "walletSummary"]);
  const subscription = getNestedRecord(record, ["subscription", "currentSubscription"]);
  const vehicles = asArray(record.vehicles ?? record.vehiclePlates);
  const plates = vehicles
    .map((vehicle) => {
      if (typeof vehicle === "string") return vehicle;
      return getString(asRecord(vehicle), ["plate"]);
    })
    .filter(Boolean)
    .join(", ");

  return (
    <Card>
      <View className="gap-2">
        <Text className="text-lg font-bold text-uau-black">{getString(record, ["name"], "Cliente")}</Text>
        <Text className="text-sm text-uau-gray">Status: {getString(subscription, ["status"], getString(record, ["subscriptionStatus"], "-"))}</Text>
        {plates ? <Text className="text-sm text-uau-gray">Placas: {plates}</Text> : null}
        <View className="flex-row justify-between gap-3">
          <Text className="text-sm text-uau-gray">Saldo resumido</Text>
          <MoneyText
            className="text-sm font-semibold text-uau-black"
            value={getNumber(wallet, ["availableBalance", "totalBalance"], getNumber(record, ["walletBalance"], 0))}
          />
        </View>
      </View>
    </Card>
  );
}
