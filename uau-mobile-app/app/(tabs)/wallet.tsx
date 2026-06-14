import { Text, View } from "react-native";
import { Card } from "@/components/Card";
import { DateText } from "@/components/DateText";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { Loading } from "@/components/Loading";
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

  return (
    <Screen>
      <View className="gap-5">
        <Text className="text-3xl font-bold text-uau-black">Wallet / Cashback</Text>

        {walletQuery.isLoading || statementQuery.isLoading ? <Loading /> : null}
        {walletQuery.error || statementQuery.error ? (
          <ErrorState message="Não foi possível carregar sua carteira agora." />
        ) : null}

        <View className="gap-3">
          <Card>
            <Text className="text-sm text-uau-gray">Saldo disponível</Text>
            <MoneyText
              className="mt-2 text-3xl font-bold text-uau-black"
              value={getNumber(wallet, ["availableBalance", "balance", "totalBalance"], 0)}
            />
          </Card>

          <View className="flex-row gap-3">
            <Card>
              <Text className="text-sm text-uau-gray">Promocional</Text>
              <MoneyText
                className="mt-2 text-xl font-bold text-uau-black"
                value={getNumber(wallet, ["promotionalBalance", "promoBalance"], 0)}
              />
            </Card>
            <Card>
              <Text className="text-sm text-uau-gray">Bloqueado</Text>
              <MoneyText className="mt-2 text-xl font-bold text-uau-black" value={getNumber(wallet, ["blockedBalance"], 0)} />
            </Card>
          </View>
        </View>

        <View className="gap-3">
          <Text className="text-xl font-bold text-uau-black">Extrato</Text>
          {statement.length === 0 && !statementQuery.isLoading ? (
            <EmptyState title="Sem movimentações" description="Quando houver cashback, seu extrato aparecerá aqui." />
          ) : null}

          {statement.map((item, index) => {
            const record = asRecord(item);
            return (
              <Card key={getString(record, ["id"], String(index))}>
                <View className="flex-row justify-between gap-3">
                  <View className="flex-1">
                    <Text className="font-semibold text-uau-black">
                      {getString(record, ["description", "origin", "type"], "Movimentação")}
                    </Text>
                    <DateText className="mt-1 text-xs text-uau-gray" value={getString(record, ["createdAt"])} />
                  </View>
                  <MoneyText className="font-bold text-uau-black" value={getNumber(record, ["amount"], 0)} />
                </View>
              </Card>
            );
          })}
        </View>
      </View>
    </Screen>
  );
}
