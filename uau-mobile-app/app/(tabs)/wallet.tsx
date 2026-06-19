import { LinearGradient } from "expo-linear-gradient";
import { Text, View } from "react-native";
import { Card } from "@/components/Card";
import { FadeInView } from "@/components/FadeInView";
import { DateText } from "@/components/DateText";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { Loading } from "@/components/Loading";
import { SkeletonList } from "@/components/Skeleton";
import { MoneyText } from "@/components/MoneyText";
import { Screen } from "@/components/Screen";
import { useMyStatement, useMyWallet } from "@/features/wallet/wallet.hooks";
import { asArray, asRecord, getNumber, getString } from "@/utils/data";

function normalizeStatement(value: unknown) {
  if (Array.isArray(value)) return value;
  const record = asRecord(value);
  return asArray(record.items ?? record.data);
}

export default function WalletScreen() {
  const walletQuery = useMyWallet();
  const statementQuery = useMyStatement();
  const wallet = asRecord(walletQuery.data);
  const statement = normalizeStatement(statementQuery.data);

  function onRefresh() {
    void walletQuery.refetch();
    void statementQuery.refetch();
  }

  return (
    <Screen
      onRefresh={onRefresh}
      refreshing={walletQuery.isFetching || statementQuery.isFetching}
      statusBarStyle="light"
    >
      <View className="gap-5">
        <View className="-mx-5 -mt-6 rounded-b-3xl bg-uau-teal px-5 pb-6 pt-4">
          <Text className="text-2xl font-bold text-white">Minha Carteira</Text>
          <Text className="mt-1 text-sm text-white/80">Seu saldo e extrato de cashback</Text>
        </View>

        {walletQuery.isLoading || statementQuery.isLoading ? <SkeletonList count={4} /> : null}
        {walletQuery.error || statementQuery.error ? (
          <ErrorState message="Não foi possível carregar sua carteira agora." />
        ) : null}

        {/* Hero — Saldo disponível */}
        <View className="overflow-hidden rounded-2xl">
          <LinearGradient
            colors={["#009B8D", "#00695C"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ padding: 24 }}
          >
            <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, fontWeight: "600" }}>
              Saldo disponível
            </Text>
            <MoneyText
              style={{ color: "white", fontSize: 36, fontWeight: "700", marginTop: 6 }}
              value={getNumber(wallet, ["availableBalance", "balance", "totalBalance"], 0)}
            />
          </LinearGradient>
        </View>

        {/* Saldos secundários */}
        <View className="flex-row gap-3">
          <View className="flex-1 rounded-xl border border-gray-100 bg-white p-4">
            <Text className="text-xs font-semibold text-uau-teal">Promocional</Text>
            <MoneyText
              className="mt-1 text-xl font-bold text-uau-black"
              value={getNumber(wallet, ["promotionalBalance", "promoBalance"], 0)}
            />
          </View>
          <View className="flex-1 rounded-xl border border-gray-100 bg-white p-4">
            <Text className="text-xs font-semibold text-uau-gray">Bloqueado</Text>
            <MoneyText
              className="mt-1 text-xl font-bold text-uau-black"
              value={getNumber(wallet, ["blockedBalance"], 0)}
            />
          </View>
        </View>

        {getNumber(wallet, ["welcomeBonusBalance"], 0) > 0 ? (
          <View className="rounded-xl border border-amber-100 bg-amber-50 p-4">
            <Text className="text-xs font-semibold text-amber-700">Bônus de boas-vindas</Text>
            <MoneyText
              className="mt-1 text-xl font-bold text-amber-800"
              value={getNumber(wallet, ["welcomeBonusBalance"], 0)}
            />
            <Text className="mt-1 text-xs text-amber-600">Válido por 7 dias · uso exclusivo em assinaturas</Text>
          </View>
        ) : null}

        {/* Extrato */}
        <View className="gap-3">
          <View className="border-l-4 border-uau-teal pl-3">
            <Text className="text-xl font-bold text-uau-black">Extrato</Text>
          </View>

          {statement.length === 0 && !statementQuery.isLoading ? (
            <EmptyState title="Sem movimentações" description="Quando houver cashback, seu extrato aparecerá aqui." />
          ) : null}

          {statement.map((item, index) => {
            const record = asRecord(item);
            const amount = getNumber(record, ["amount"], 0);
            const isCredit = amount >= 0;

            return (
              <FadeInView key={getString(record, ["id"], String(index))} index={index}>
              <Card>
                <View className="flex-row items-center justify-between gap-3">
                  <View className="flex-1">
                    <Text className="font-semibold text-uau-black">
                      {getString(record, ["description", "origin", "type"], "Movimentação")}
                    </Text>
                    <DateText className="mt-1 text-xs text-uau-gray" value={getString(record, ["createdAt"])} />
                  </View>
                  <MoneyText
                    className={`font-bold ${isCredit ? "text-uau-teal" : "text-red-500"}`}
                    value={amount}
                  />
                </View>
              </Card>
              </FadeInView>
            );
          })}
        </View>
      </View>
    </Screen>
  );
}
