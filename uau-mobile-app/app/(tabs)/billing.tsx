import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Linking, Text, View } from "react-native";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { DateText } from "@/components/DateText";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { Loading } from "@/components/Loading";
import { SkeletonList } from "@/components/Skeleton";
import { MoneyText } from "@/components/MoneyText";
import { Screen } from "@/components/Screen";
import { useToast } from "@/components/Toast";
import { useMyBillingHistory, useMyCurrentBilling } from "@/features/billing/billing.hooks";
import { asArray, asRecord, getNestedRecord, getNumber, getString } from "@/utils/data";

function normalizeHistory(value: unknown) {
  if (Array.isArray(value)) return value;
  const record = asRecord(value);
  return asArray(record.items ?? record.data);
}

const STATUS_LABELS: Record<string, { bg: string; text: string; label: string }> = {
  PENDING:   { bg: "#FFF8E1", text: "#F57F17", label: "Pendente" },
  PAID:      { bg: "#E8F5E9", text: "#2E7D32", label: "Pago" },
  OVERDUE:   { bg: "#FFEBEE", text: "#C62828", label: "Vencido" },
  CANCELLED: { bg: "#FAFAFA", text: "#616161", label: "Cancelado" },
  REFUNDED:  { bg: "#FAFAFA", text: "#616161", label: "Reembolsado" },
};

function getStatusStyle(status: string): { bg: string; text: string; label: string } {
  return STATUS_LABELS[status?.toUpperCase()] ?? { bg: "#F5F5F5", text: "#616161", label: status ?? "" };
}

export default function BillingScreen() {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const currentQuery = useMyCurrentBilling();
  const historyQuery = useMyBillingHistory();
  const billing = asRecord(currentQuery.data);
  const asaasPayment = getNestedRecord(billing, ["asaasPayment"]);
  const history = normalizeHistory(historyQuery.data);
  const pixCopyPaste = getString(billing, ["pixCopyPaste"]) || getString(asaasPayment, ["pixCopyPaste"]);
  const pixQrCode = getString(billing, ["pixQrCode"]) || getString(asaasPayment, ["pixQrCode"]);
  const invoiceUrl = getString(billing, ["invoiceUrl"]) || getString(asaasPayment, ["invoiceUrl"]);
  const planName = getString(getNestedRecord(billing, ["subscription", "plan"]), ["name"]);

  async function copyPix() {
    if (!pixCopyPaste) return;
    await Clipboard.setStringAsync(pixCopyPaste);
    setCopied(true);
    toast.show("Código PIX copiado!", "success");
  }

  function onRefresh() {
    void currentQuery.refetch();
    void historyQuery.refetch();
  }

  return (
    <Screen
      onRefresh={onRefresh}
      refreshing={currentQuery.isFetching || historyQuery.isFetching}
      statusBarStyle="light"
    >
      <View className="gap-5">
        <View className="-mx-5 -mt-6 rounded-b-3xl bg-uau-teal px-5 pb-6 pt-4">
          <Text className="text-2xl font-bold text-white">Cobranças</Text>
          <Text className="mt-1 text-sm text-white/80">Acompanhe suas faturas e histórico</Text>
        </View>

        {currentQuery.isLoading || historyQuery.isLoading ? <SkeletonList count={3} /> : null}
        {currentQuery.error || historyQuery.error ? (
          <ErrorState message="Não foi possível carregar suas cobranças agora." />
        ) : null}

        {/* Cobrança atual */}
        {currentQuery.data ? (() => {
          const rawStatus = getString(billing, ["status"], "");
          const statusStyle = getStatusStyle(rawStatus);
          return (
            <View className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
              <View className="border-l-4 border-uau-teal p-4">
                <View className="flex-row items-center justify-between gap-3">
                  <View className="flex-1 gap-0.5">
                    <Text className="text-lg font-bold text-uau-black">Cobrança atual</Text>
                    {planName ? <Text className="text-xs text-uau-gray" numberOfLines={1}>{planName}</Text> : null}
                  </View>
                  <View style={{ backgroundColor: statusStyle.bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 }}>
                    <Text style={{ color: statusStyle.text, fontSize: 12, fontWeight: "600" }}>{statusStyle.label}</Text>
                  </View>
                </View>

                <View className="mt-4 gap-3">
                  <MoneyRow label="Valor base" value={getNumber(billing, ["baseAmount", "totalAmount", "amount"], 0)} />
                  <MoneyRow
                    label="Cashback usado"
                    value={
                      getNumber(billing, ["cashbackUsed"], 0) +
                      getNumber(billing, ["promotionalCashbackUsed"], 0) +
                      getNumber(billing, ["realCashbackUsed"], 0)
                    }
                  />
                  <MoneyRow label="Valor a pagar" value={getNumber(billing, ["gatewayAmount", "amount"], 0)} highlight />
                  <View className="flex-row justify-between gap-3">
                    <Text className="text-sm text-uau-gray">Vencimento</Text>
                    <DateText className="text-sm font-semibold text-uau-black" value={getString(billing, ["dueDate"])} />
                  </View>
                  <Row label="Método" value={getString(billing, ["paymentMethod"], "-")} />
                </View>

                {pixQrCode || pixCopyPaste ? (
                  <View className="mt-4 gap-3 rounded-xl bg-uau-light p-4">
                    <Text className="font-semibold text-uau-teal">Pagar via PIX</Text>
                    {pixCopyPaste ? <Text className="text-xs leading-5 text-uau-gray" numberOfLines={3}>{pixCopyPaste}</Text> : null}
                    <Button onPress={() => void copyPix()} title={copied ? "✓ Código copiado" : "Copiar código PIX"} />
                  </View>
                ) : null}
                {invoiceUrl ? (
                  <View className="mt-3">
                    <Button
                      onPress={() => void Linking.openURL(invoiceUrl)}
                      title="Ver fatura completa ↗"
                      variant="ghost"
                    />
                  </View>
                ) : null}
              </View>
            </View>
          );
        })() : (
          <View className="gap-4">
            <Card>
              <View className="gap-4">
                <View className="gap-2">
                  <Text className="text-lg font-semibold text-uau-black">Sem cobrança atual</Text>
                  <Text className="text-sm leading-5 text-uau-gray">
                    Quando houver uma fatura em aberto, ela aparecerá aqui.
                  </Text>
                </View>
                <Button onPress={() => router.push("/subscribe")} title="Escolher plano" />
              </View>
            </Card>
            <Card>
              <View className="gap-4">
                <Text className="text-base font-bold text-uau-black">Como funciona?</Text>
                <View className="gap-3">
                  <View className="flex-row items-center gap-3">
                    <View className="h-9 w-9 items-center justify-center rounded-full bg-uau-teal/10">
                      <Ionicons name="star-outline" size={18} color="#009688" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-uau-black">Assine um plano</Text>
                      <Text className="text-xs leading-4 text-uau-gray">Escolha o plano ideal para sua rotina de lavagens</Text>
                    </View>
                  </View>
                  <View className="flex-row items-center gap-3">
                    <View className="h-9 w-9 items-center justify-center rounded-full bg-uau-teal/10">
                      <Ionicons name="car-outline" size={18} color="#009688" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-uau-black">Faça check-ins</Text>
                      <Text className="text-xs leading-4 text-uau-gray">Leve seu carro à unidade e registre o atendimento</Text>
                    </View>
                  </View>
                  <View className="flex-row items-center gap-3">
                    <View className="h-9 w-9 items-center justify-center rounded-full bg-uau-teal/10">
                      <Ionicons name="wallet-outline" size={18} color="#009688" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-semibold text-uau-black">Acumule cashback</Text>
                      <Text className="text-xs leading-4 text-uau-gray">Use o cashback para abater faturas e em parceiros</Text>
                    </View>
                  </View>
                </View>
              </View>
            </Card>
          </View>
        )}

        {/* Histórico */}
        <View className="gap-3">
          <View className="border-l-4 border-uau-teal pl-3">
            <Text className="text-xl font-bold text-uau-black">Histórico</Text>
          </View>

          {history.length === 0 && !historyQuery.isLoading ? (
            <>
              <EmptyState title="Histórico vazio" description="Suas cobranças pagas ou vencidas aparecerão aqui." />
              <Card>
                <View className="gap-3">
                  <Text className="text-base font-bold text-uau-black">📋 Como funciona o pagamento?</Text>
                  <View className="gap-2">
                    {[
                      "Pagamento automático todo mês via Pix ou cartão",
                      "Receba notificação 3 dias antes do vencimento",
                      "Use cashback para abater até 50% da fatura",
                    ].map((item, i) => (
                      <View key={i} className="flex-row items-center gap-2">
                        <Ionicons name="checkmark-circle-outline" size={16} color="#009688" />
                        <Text className="flex-1 text-sm text-uau-gray">{item}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </Card>
            </>
          ) : null}

          {history.map((item, index) => {
            const record = asRecord(item);
            const rawStatus = getString(record, ["status"], "");
            const statusStyle = getStatusStyle(rawStatus);

            return (
              <Card key={getString(record, ["id"], String(index))}>
                <View className="flex-row items-center justify-between gap-3">
                  <View className="flex-1 gap-1">
                    <View style={{ backgroundColor: statusStyle.bg, alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 }}>
                      <Text style={{ color: statusStyle.text, fontSize: 11, fontWeight: "600" }}>{statusStyle.label}</Text>
                    </View>
                    <DateText className="text-xs text-uau-gray" value={getString(record, ["dueDate", "createdAt"])} />
                  </View>
                  <MoneyText className="text-base font-bold text-uau-black" value={getNumber(record, ["gatewayAmount", "amount"], 0)} />
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

function MoneyRow({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <View className="flex-row justify-between gap-3">
      <Text className="text-sm text-uau-gray">{label}</Text>
      <MoneyText
        className={`text-sm font-semibold ${highlight ? "text-uau-teal" : "text-uau-black"}`}
        value={value}
      />
    </View>
  );
}
