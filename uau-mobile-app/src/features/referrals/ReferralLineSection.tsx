import { Text, View } from "react-native";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { asRecord, getString } from "@/utils/data";

type ReferralLineSectionProps = {
  title: string;
  users: unknown[];
};

export function ReferralLineSection({ title, users }: ReferralLineSectionProps) {
  return (
    <View className="gap-3">
      <Text className="text-xl font-bold text-uau-black">{title}</Text>
      {users.length === 0 ? (
        <EmptyState title="Linha vazia" description="Quando houver indicados nesta linha, eles aparecerao aqui." />
      ) : null}
      {users.map((user, index) => {
        const record = asRecord(user);
        return (
          <Card key={getString(record, ["id"], String(index))}>
            <Text className="font-semibold text-uau-black">{getString(record, ["name", "fullName"], "Usuario indicado")}</Text>
            {getString(record, ["email"]) ? <Text className="mt-1 text-sm text-uau-gray">{getString(record, ["email"])}</Text> : null}
            {getString(record, ["subscriptionStatus", "status"]) ? (
              <Text className="mt-1 text-xs font-semibold text-uau-green">
                {getString(record, ["subscriptionStatus", "status"])}
              </Text>
            ) : null}
          </Card>
        );
      })}
    </View>
  );
}
