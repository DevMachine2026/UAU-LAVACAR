import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { DateText } from "@/components/DateText";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { Loading } from "@/components/Loading";
import { MoneyText } from "@/components/MoneyText";
import { Screen } from "@/components/Screen";
import { useMyBillingHistory, useMyCurrentBilling } from "@/features/billing/billing.hooks";
import { asArray, asRecord, getNestedRecord, getNumber, getString } from "@/utils/data";

function normalizeHistory(value: unknown) {
  if (Array.isArray(value)) return value;
  const record = asRecord(value);
  return asArray(record.items ?? record.data);
}

export default function BillingScreen() {
  const [copied, setCopied] = useState(false);
  const currentQuery = useMyCurrentBilling();
  const historyQuery = useMyBillingHistory();
  const billing = asRecord(currentQuery.data);
  const asaasPayment = getNestedRecord(billing, ["asaasPayment"]);
  const history = normalizeHistory(historyQuery.data);
  const pixCopyPaste = getString(billing, ["pixCopyPaste"]) || getString(asaasPayment, ["pixCopyPaste"]);
  const pixQrCode = getString(billing, ["pixQrCode"]) || getString(asaasPayment, ["pixQrCode"]);

  async function copyPix() {
    if (!pixCopyPaste) return;
    await Clipboard.setStringAsync(pixCopyPaste);
    setCopied(true);
  }

  return (
    <Screen>
      <View className="gap-5">
        <Text className="text-3xl font-bold text-uau-black">Minhas cobrancas</Text>

        {currentQuery.isLoading || historyQuery.isLoading ? <Loading /> : null}
        {currentQuery.error || historyQuery.error ? (
          <ErrorState message="Nao foi possivel carregar suas cobrancas agora." />
        ) : null}

        {currentQuery.data ? (
          <Card>
            <View className="gap-3">
              <Text className="text-xl font-bold text-uau-black">Cobranca atual</Text>
              <Row label="Status" value={getString(billing, ["status"], "-")} />
              <MoneyRow label="Valor base" value={getNumber(billing, ["baseAmount", "totalAmount", "amount"], 0)} />
              <MoneyRow
                label="Cashback usado"
                value={
                  getNumber(billing, ["cashbackUsed"], 0) +
                  getNumber(billing, ["promotionalCashbackUsed"], 0) +
                  getNumber(billing, ["realCashbackUsed"], 0)
                }
              />
              <MoneyRow label="Valor via gateway" value={getNumber(billing, ["gatewayAmount", "amount"], 0)} />
              <View className="flex-row justify-between gap-3">
                <Text className="text-sm text-uau-gray">Vencimento</Text>
                <DateText className="text-sm font-semibold text-uau-black" value={getString(billing, ["dueDate"])} />
              </View>
              <Row label="Metodo" value={getString(billing, ["paymentMethod"], "-")} />

              {pixQrCode || pixCopyPaste ? (
                <View className="mt-2 gap-3 rounded-lg bg-uau-light p-3">
                  <Text className="font-semibold text-uau-black">PIX</Text>
                  {pixQrCode ? <Text className="text-xs leading-5 text-uau-gray">{pixQrCode}</Text> : null}
                  {pixCopyPaste ? <Text className="text-xs leading-5 text-uau-gray">{pixCopyPaste}</Text> : null}
                  <Button onPress={() => void copyPix()} title={copied ? "Codigo copiado" : "Copiar codigo PIX"} />
                </View>
              ) : null}
            </View>
          </Card>
        ) : (
          <Card>
            <View className="gap-4">
              <View className="gap-2">
                <Text className="text-lg font-semibold text-uau-black">Sem cobranca atual</Text>
                <Text className="text-sm leading-5 text-uau-gray">
                  Quando houver cobranca em aberto, ela aparecera aqui.
                </Text>
              </View>
              <Button onPress={() => router.push("/subscribe")} title="Escolher plano" />
            </View>
          </Card>
        )}

        <View className="gap-3">
          <Text className="text-xl font-bold text-uau-black">Historico</Text>
          {history.length === 0 && !historyQuery.isLoading ? (
            <EmptyState title="Historico vazio" description="Suas cobrancas pagas ou vencidas aparecerao aqui." />
          ) : null}

          {history.map((item, index) => {
            const record = asRecord(item);
            return (
              <Card key={getString(record, ["id"], String(index))}>
                <View className="flex-row justify-between gap-3">
                  <View className="flex-1">
                    <Text className="font-semibold text-uau-black">{getString(record, ["status"], "Cobranca")}</Text>
                    <DateText className="mt-1 text-xs text-uau-gray" value={getString(record, ["dueDate", "createdAt"])} />
                  </View>
                  <MoneyText className="font-bold text-uau-black" value={getNumber(record, ["gatewayAmount", "amount"], 0)} />
                </View>
              </Card>
            );
          })}
        </View>
      </View>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between gap-3">
      <Text className="text-sm text-uau-gray">{label}</Text>
      <Text className="text-sm font-semibold text-uau-black">{value}</Text>
    </View>
  );
}

function MoneyRow({ label, value }: { label: string; value: number }) {
  return (
    <View className="flex-row justify-between gap-3">
      <Text className="text-sm text-uau-gray">{label}</Text>
      <MoneyText className="text-sm font-semibold text-uau-black" value={value} />
    </View>
  );
}
