import { Text, View } from "react-native";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { Loading } from "@/components/Loading";
import { Screen } from "@/components/Screen";
import { PartnerCard } from "@/features/partners/PartnerCard";
import { Partner } from "@/features/partners/partners.api";
import { usePartners } from "@/features/partners/partners.hooks";
import { asArray, asRecord } from "@/utils/data";

function normalizePartners(value: unknown) {
  if (Array.isArray(value)) return value as Partner[];
  const record = asRecord(value);
  return asArray<Partner>(record.items ?? record.data);
}

export default function PartnersScreen() {
  const partnersQuery = usePartners();
  const partners = normalizePartners(partnersQuery.data);

  return (
    <Screen>
      <View className="gap-5">
        <View className="gap-2">
          <Text className="text-3xl font-bold text-uau-black">Parceiros</Text>
          <Text className="text-base leading-6 text-uau-gray">
            Use cashback como desconto operacional no parceiro e ganhe novo cashback sobre o valor pago.
          </Text>
        </View>

        {partnersQuery.isLoading ? <Loading /> : null}
        {partnersQuery.error ? <ErrorState message="Nao foi possivel carregar os parceiros agora." /> : null}
        {partners.length === 0 && !partnersQuery.isLoading ? (
          <EmptyState title="Nenhum parceiro encontrado" description="Parceiros locais aparecerao aqui quando cadastrados." />
        ) : null}

        {partners.map((partner) => (
          <PartnerCard key={partner.id} partner={partner} />
        ))}
      </View>
    </Screen>
  );
}
