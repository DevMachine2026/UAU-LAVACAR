import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { ErrorState } from "@/components/ErrorState";
import { Input } from "@/components/Input";
import { Loading } from "@/components/Loading";
import { Screen } from "@/components/Screen";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useAuthStore } from "@/auth/auth.store";
import { PartnerQrBox } from "@/features/partners/PartnerQrBox";
import { PartnerRuleCard } from "@/features/partners/PartnerRuleCard";
import { PartnerTransactionPreview } from "@/features/partners/PartnerTransactionPreview";
import { PartnerQrResult, PartnerTransactionPreview as Preview } from "@/features/partners/partners.api";
import {
  useConfirmPartnerTransaction,
  useCreatePartnerQr,
  usePartner,
  usePreviewPartnerTransaction
} from "@/features/partners/partners.hooks";
import { asRecord, getNestedRecord, getString } from "@/utils/data";

function parseMoney(value: string) {
  const normalized = value.replace(/\./g, "").replace(",", ".");
  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : 0;
}

export default function PartnerDetailScreen() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const params = useLocalSearchParams<{ id?: string }>();
  const partnerId = Array.isArray(params.id) ? params.id[0] : params.id ?? "";
  const partnerQuery = usePartner(partnerId);
  const previewMutation = usePreviewPartnerTransaction();
  const confirmMutation = useConfirmPartnerTransaction();
  const qrMutation = useCreatePartnerQr();

  const [grossAmount, setGrossAmount] = useState("");
  const [cashbackToUse, setCashbackToUse] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState<"PIX" | "CREDIT_CARD">("PIX");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [qr, setQr] = useState<PartnerQrResult | null>(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const partner = partnerQuery.data;
  const partnerRecord = asRecord(partner);
  const city = getNestedRecord(partnerRecord, ["city"]);
  const unit = getNestedRecord(partnerRecord, ["unit"]);
  const location = [getString(partnerRecord, ["cityName"]) || getString(city, ["name"]), getString(partnerRecord, ["unitName"]) || getString(unit, ["name"])]
    .filter(Boolean)
    .join(" - ");

  function buildPayload() {
    const gross = parseMoney(grossAmount);
    const cashback = parseMoney(cashbackToUse);

    if (gross <= 0) {
      throw new Error("Informe um valor de compra maior que zero.");
    }

    if (cashback < 0) {
      throw new Error("Cashback nao pode ser negativo.");
    }

    return {
      customerUserId: user?.id,
      grossAmount: gross,
      cashbackToUse: cashback,
      paymentMethod
    };
  }

  async function simulate() {
    setError(null);
    setSuccess(false);
    try {
      const payload = buildPayload();
      const result = await previewMutation.mutateAsync({ partnerId, payload });
      setPreview(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel simular a compra.");
    }
  }

  async function confirm() {
    setError(null);
    try {
      const payload = buildPayload();
      const result = await confirmMutation.mutateAsync({ partnerId, payload });
      setPreview(result);
      setSuccess(true);
      void queryClient.invalidateQueries({ queryKey: ["wallet"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel confirmar o uso de cashback.");
    }
  }

  async function createQr() {
    setError(null);
    try {
      const gross = parseMoney(grossAmount);
      if (gross <= 0) {
        throw new Error("Informe um valor de compra maior que zero para gerar o QR.");
      }
      const result = await qrMutation.mutateAsync({ partnerId, payload: { grossAmount: gross, customerUserId: user?.id } });
      setQr(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel gerar o QR Code.");
    }
  }

  if (partnerQuery.isLoading) {
    return <Loading />;
  }

  return (
    <Screen statusBarStyle="light">
      <View className="gap-5 pb-6">
        <ScreenHeader
          title={partner?.name ?? "Parceiro"}
          subtitle={partner ? `${getString(partnerRecord, ["category"], "Parceiro local")}${location ? ` · ${location}` : ""}` : undefined}
        />

        {partnerQuery.error ? <ErrorState message="Não foi possível carregar este parceiro." /> : null}
        {error ? <ErrorState title="Atenção" message={error} /> : null}

        {partner ? (
          <>

            <PartnerRuleCard partner={partner} />

            <Card>
              <View className="gap-4">
                <Text className="text-xl font-bold text-uau-black">Usar cashback</Text>
                <Input
                  keyboardType="decimal-pad"
                  label="Valor da compra"
                  onChangeText={setGrossAmount}
                  placeholder="100,00"
                  value={grossAmount}
                />
                <Input
                  keyboardType="decimal-pad"
                  label="Cashback que deseja usar"
                  onChangeText={setCashbackToUse}
                  placeholder="0,00"
                  value={cashbackToUse}
                />
                <View className="flex-row gap-3">
                  <Button
                    onPress={() => setPaymentMethod("PIX")}
                    title={paymentMethod === "PIX" ? "PIX selecionado" : "PIX"}
                    variant={paymentMethod === "PIX" ? "primary" : "ghost"}
                  />
                  <Button
                    onPress={() => setPaymentMethod("CREDIT_CARD")}
                    title={paymentMethod === "CREDIT_CARD" ? "Cartao selecionado" : "Cartao"}
                    variant={paymentMethod === "CREDIT_CARD" ? "primary" : "ghost"}
                  />
                </View>
                <Text className="text-sm leading-5 text-uau-gray">
                  Cashback usado no parceiro funciona como desconto do parceiro e nao gera divida da UAU.
                </Text>
                <Text className="text-sm leading-5 text-uau-gray">
                  O novo cashback incide somente sobre o valor pago via PIX/cartao.
                </Text>
              </View>
            </Card>

            <Button loading={previewMutation.isPending} onPress={() => void simulate()} title="Simular" />

            {preview ? <PartnerTransactionPreview preview={preview} /> : null}

            {preview ? (
              <View className="gap-3">
                <Button loading={confirmMutation.isPending} onPress={() => void confirm()} title="Confirmar uso" />
                <Button loading={qrMutation.isPending} onPress={() => void createQr()} title="Gerar QR Code" variant="ghost" />
              </View>
            ) : (
              <Button loading={qrMutation.isPending} onPress={() => void createQr()} title="Gerar QR Code" variant="ghost" />
            )}

            {success ? (
              <Card>
                <View className="gap-3">
                  <Text className="text-xl font-bold text-uau-black">Transacao confirmada</Text>
                  <Text className="text-sm leading-5 text-uau-gray">Sua wallet foi atualizada. Voce pode conferir o saldo na carteira.</Text>
                  <Button onPress={() => router.push("/(tabs)/wallet")} title="Ir para carteira" />
                </View>
              </Card>
            ) : null}

            {qr ? <PartnerQrBox qr={qr} /> : null}
          </>
        ) : null}
      </View>
    </Screen>
  );
}
