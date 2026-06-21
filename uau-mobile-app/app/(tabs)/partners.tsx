import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { Card } from "@/components/Card";
import { ErrorState } from "@/components/ErrorState";
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
        {partners.length === 0 && !partnersQuery.isLoading && !partnersQuery.error ? (
          <View className="gap-4">
            <View className="items-center gap-3 py-6">
              <View className="h-20 w-20 items-center justify-center rounded-full bg-uau-teal/10">
                <Ionicons name="storefront-outline" size={40} color="#009688" />
              </View>
              <Text className="text-xl font-bold text-uau-black">Nenhum parceiro disponível</Text>
              <Text className="text-center text-sm leading-5 text-uau-gray">
                Em breve novos parceiros estarão disponíveis aqui.
              </Text>
            </View>
            <Card>
              <View className="gap-3">
                <Text className="text-base font-bold text-uau-black">O que são os parceiros?</Text>
                <Text className="text-sm leading-5 text-uau-gray">
                  Use seu cashback como desconto em estabelecimentos parceiros e ganhe novo cashback sobre o valor pago.
                </Text>
                <View className="gap-2">
                  <View className="flex-row items-center gap-2">
                    <Ionicons name="checkmark-circle-outline" size={16} color="#009688" />
                    <Text className="text-sm text-uau-gray">Desconto direto no valor da compra</Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <Ionicons name="checkmark-circle-outline" size={16} color="#009688" />
                    <Text className="text-sm text-uau-gray">Gera novo cashback sobre o valor pago</Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <Ionicons name="checkmark-circle-outline" size={16} color="#009688" />
                    <Text className="text-sm text-uau-gray">Parceiros locais verificados pela UAU+</Text>
                  </View>
                </View>
              </View>
            </Card>
          </View>
        ) : null}

        {partners.map((partner) => (
          <PartnerCard key={partner.id} partner={partner} />
        ))}
      </View>
    </Screen>
  );
}
