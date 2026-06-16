import { Text, View } from "react-native";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { Loading } from "@/components/Loading";
import { SkeletonList } from "@/components/Skeleton";
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
    <Screen
      onRefresh={() => void partnersQuery.refetch()}
      refreshing={partnersQuery.isFetching}
      statusBarStyle="light"
    >
      <View className="gap-5">
        <View className="-mx-5 -mt-6 rounded-b-3xl bg-uau-teal px-5 pb-6 pt-4">
          <Text className="text-2xl font-bold text-white">Parceiros</Text>
          <Text className="mt-1 text-sm text-white/80">
            Use cashback como desconto e ganhe novo cashback sobre o valor pago.
          </Text>
        </View>

        {partnersQuery.isLoading ? <SkeletonList count={4} /> : null}
        {partnersQuery.error ? <ErrorState message="Não foi possível carregar os parceiros agora." /> : null}
        {partners.length === 0 && !partnersQuery.isLoading ? (
          <EmptyState title="Nenhum parceiro encontrado" description="Parceiros locais aparecerão aqui quando cadastrados." />
        ) : null}

        {partners.map((partner) => (
          <PartnerCard key={partner.id} partner={partner} />
        ))}
      </View>
    </Screen>
  );
}
