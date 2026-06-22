import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Text, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { Input } from "@/components/Input";
import { Loading } from "@/components/Loading";
import { Screen } from "@/components/Screen";
import { ScreenHeader } from "@/components/ScreenHeader";
import { CheckoutConfirmResult, CheckoutPreview, SubscriptionCheckoutPayload } from "@/features/checkout/checkout.api";
import { useSubscriptionConfirm, useSubscriptionPreview } from "@/features/checkout/checkout.hooks";
import { getFranchiseUnits, LocationItem } from "@/features/locations/locations.api";
import { getPlans, Plan } from "@/features/plans/plans.api";
import { CheckoutSummary } from "@/features/subscribe/CheckoutSummary";
import { PaymentMethodCard } from "@/features/subscribe/PaymentMethodCard";
import { PlanCard } from "@/features/subscribe/PlanCard";
import { SelectCard } from "@/features/subscribe/SelectCard";
import { StepHeader } from "@/features/subscribe/StepHeader";
import { createVehicle, getVehicles, Vehicle } from "@/features/vehicles/vehicles.api";
import { asArray, asRecord, getNestedRecord, getNumber, getString } from "@/utils/data";

function normalizeList<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  const record = asRecord(value);
  return asArray<T>(record.items ?? record.data);
}

function isActiveItem(item: unknown) {
  return asRecord(item).isActive !== false;
}

export default function SubscribeScreen() {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<LocationItem | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"PIX" | "CREDIT_CARD" | null>(null);
  const [preview, setPreview] = useState<CheckoutPreview | null>(null);
  const [confirmation, setConfirmation] = useState<CheckoutConfirmResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [vehicleForm, setVehicleForm] = useState({ plate: "", brand: "", model: "", color: "" });

  const unitsQuery = useQuery({ queryKey: ["locations", "units"], queryFn: getFranchiseUnits });
  const plansQuery = useQuery({ queryKey: ["plans"], queryFn: getPlans });
  const vehiclesQuery = useQuery({ queryKey: ["vehicles", "me"], queryFn: getVehicles });

  const units = useMemo(() => normalizeList<LocationItem>(unitsQuery.data).filter(isActiveItem), [unitsQuery.data]);
  const plans = useMemo(() => normalizeList<Plan>(plansQuery.data).filter(isActiveItem), [plansQuery.data]);
  const vehicles = useMemo(() => normalizeList<Vehicle>(vehiclesQuery.data).filter(isActiveItem), [vehiclesQuery.data]);

  // Se só há uma unidade ativa, seleciona automaticamente e o cliente nunca vê essa etapa
  useEffect(() => {
    if (!unitsQuery.isLoading && units.length === 1) {
      setSelectedUnit(units[0]);
    }
  }, [units, unitsQuery.isLoading]);

  // Decide se a etapa de seleção de unidade deve aparecer
  const showUnitStep = !unitsQuery.isLoading && units.length !== 1;

  const TOTAL_STEPS  = showUnitStep ? 6 : 5;
  const STEP_UNIT    = showUnitStep ? 1 : null;
  const STEP_PLAN    = showUnitStep ? 2 : 1;
  const STEP_VEHICLE = showUnitStep ? 3 : 2;
  const STEP_PAYMENT = showUnitStep ? 4 : 3;
  const STEP_PREVIEW = showUnitStep ? 5 : 4;
  const STEP_CONFIRM = showUnitStep ? 6 : 5;

  const createVehicleMutation = useMutation({
    mutationFn: createVehicle,
    onSuccess: (vehicle) => {
      setSelectedVehicle(vehicle);
      setVehicleForm({ plate: "", brand: "", model: "", color: "" });
      void queryClient.invalidateQueries({ queryKey: ["vehicles", "me"] });
    }
  });
  const previewMutation = useSubscriptionPreview();
  const confirmMutation = useSubscriptionConfirm();

  const isLoading = unitsQuery.isLoading || plansQuery.isLoading || vehiclesQuery.isLoading;
  const queryError = unitsQuery.error || plansQuery.error || vehiclesQuery.error;

  function payload(): SubscriptionCheckoutPayload | null {
    if (!selectedPlan || !selectedVehicle || !paymentMethod) return null;
    return {
      unitId: selectedUnit?.id,
      planId: selectedPlan.id,
      vehicleId: selectedVehicle.id,
      paymentMethod
    };
  }

  function validateCurrentStep() {
    if (STEP_UNIT !== null && step === STEP_UNIT && !selectedUnit) return "Escolha uma unidade para continuar.";
    if (step === STEP_PLAN && !selectedPlan) return "Escolha um plano para continuar.";
    if (step === STEP_VEHICLE && !selectedVehicle) return "Escolha ou cadastre um veiculo para continuar.";
    if (step === STEP_PAYMENT && !paymentMethod) return "Escolha uma forma de pagamento para continuar.";
    return null;
  }

  async function next() {
    setError(null);
    const validation = validateCurrentStep();
    if (validation) {
      setError(validation);
      return;
    }

    if (step === STEP_PAYMENT) {
      const checkoutPayload = payload();
      if (!checkoutPayload) return;
      try {
        const result = await previewMutation.mutateAsync(checkoutPayload);
        setPreview(result);
        setStep(STEP_PREVIEW);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Nao foi possivel gerar o preview.");
      }
      return;
    }

    setStep((current) => Math.min(current + 1, TOTAL_STEPS));
  }

  async function confirm() {
    setError(null);
    const checkoutPayload = payload();
    if (!checkoutPayload) return;

    try {
      const result = await confirmMutation.mutateAsync(checkoutPayload);
      setConfirmation(result);
      setStep(STEP_CONFIRM);
      void queryClient.invalidateQueries({ queryKey: ["billing"] });
      void queryClient.invalidateQueries({ queryKey: ["wallet"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel confirmar a assinatura.");
    }
  }

  async function saveVehicle() {
    const plate = vehicleForm.plate.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!plate) {
      setError("Informe a placa do veiculo.");
      return;
    }
    setError(null);
    try {
      await createVehicleMutation.mutateAsync({
        plate,
        brand: vehicleForm.brand.trim() || undefined,
        model: vehicleForm.model.trim() || undefined,
        color: vehicleForm.color.trim() || undefined
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel cadastrar o veiculo.");
    }
  }

  async function copyPix() {
    const result = asRecord(confirmation);
    const billingCycle = getNestedRecord(result, ["billingCycle"]);
    const pix = getString(result, ["pixCopyPaste"]) || getString(billingCycle, ["pixCopyPaste"]);
    if (!pix) return;
    await Clipboard.setStringAsync(pix);
    setCopied(true);
  }

  return (
    <Screen statusBarStyle="light">
      <View className="gap-6 pb-8">
        <ScreenHeader title="Assinar plano" subtitle="Escolha seu plano e finalize o checkout." />
        {isLoading ? <Loading /> : null}
        {queryError ? <ErrorState message="Nao foi possivel carregar os dados do checkout agora." /> : null}
        {error ? <ErrorState title="Atencao" message={error} /> : null}

        {STEP_UNIT !== null && step === STEP_UNIT ? (
          <Step title="Unidade" description="Escolha sua unidade principal. Planos nacionais continuam podendo usar outras unidades conforme regra do plano." current={step} total={TOTAL_STEPS}>
            {units.map((unit) => (
              <SelectCard
                description={getString(asRecord(unit), ["address", "neighborhood", "document"])}
                key={unit.id}
                onPress={() => setSelectedUnit(unit)}
                selected={selectedUnit?.id === unit.id}
                title={unit.name}
              />
            ))}
          </Step>
        ) : null}

        {step === STEP_PLAN ? (
          <Step title="Plano" description="Escolha o plano ideal para sua rotina." current={step} total={TOTAL_STEPS}>
            {plans.map((plan) => (
              <PlanCard key={plan.id} onPress={() => setSelectedPlan(plan)} plan={plan} selected={selectedPlan?.id === plan.id} />
            ))}
          </Step>
        ) : null}

        {step === STEP_VEHICLE ? (
          <Step title="Veiculo" description="Escolha um veiculo cadastrado ou cadastre um novo." current={step} total={TOTAL_STEPS}>
            {vehicles.length === 0 ? (
              <EmptyState title="Nenhum veiculo cadastrado" description="Cadastre sua placa abaixo para continuar." />
            ) : null}
            {vehicles.map((vehicle) => {
              const record = asRecord(vehicle);
              return (
                <SelectCard
                  description={[getString(record, ["brand", "make"]), getString(record, ["model"]), getString(record, ["color"])]
                    .filter(Boolean)
                    .join(" - ")}
                  key={vehicle.id}
                  onPress={() => setSelectedVehicle(vehicle)}
                  selected={selectedVehicle?.id === vehicle.id}
                  title={vehicle.plate}
                />
              );
            })}
            <Card>
              <View className="gap-3">
                <Text className="text-lg font-bold text-uau-black">Cadastrar novo veiculo</Text>
                <Input
                  autoCapitalize="characters"
                  label="Placa"
                  onChangeText={(plate) => setVehicleForm((current) => ({ ...current, plate }))}
                  placeholder="ABC1D23"
                  value={vehicleForm.plate}
                />
                <Input
                  label="Marca"
                  onChangeText={(brand) => setVehicleForm((current) => ({ ...current, brand }))}
                  value={vehicleForm.brand}
                />
                <Input
                  label="Modelo"
                  onChangeText={(model) => setVehicleForm((current) => ({ ...current, model }))}
                  value={vehicleForm.model}
                />
                <Input
                  label="Cor"
                  onChangeText={(color) => setVehicleForm((current) => ({ ...current, color }))}
                  value={vehicleForm.color}
                />
                <Button loading={createVehicleMutation.isPending} onPress={() => void saveVehicle()} title="Salvar veiculo" />
              </View>
            </Card>
          </Step>
        ) : null}

        {step === STEP_PAYMENT ? (
          <Step title="Forma de pagamento" description="O cashback será aplicado automaticamente conforme as regras do UAU+." current={step} total={TOTAL_STEPS}>
            <PaymentMethodCard
              description="Usa cashback disponível e gera PIX para pagar o restante."
              onPress={() => setPaymentMethod("PIX")}
              selected={paymentMethod === "PIX"}
              title="Cashback + PIX"
            />
            <PaymentMethodCard
              description="Usa cashback disponível e prepara pagamento do restante no cartão."
              onPress={() => setPaymentMethod("CREDIT_CARD")}
              selected={paymentMethod === "CREDIT_CARD"}
              title="Cashback + Cartao"
            />
            <Text className="text-sm leading-5 text-uau-gray">
              O backend calcula o uso de cashback promocional e real automaticamente, incluindo a regra 50/50 quando
              aplicavel.
            </Text>
          </Step>
        ) : null}

        {step === STEP_PREVIEW && preview ? (
          <Step title="Preview" description="Confira os valores antes de confirmar." current={step} total={TOTAL_STEPS}>
            <CheckoutSummary preview={preview} unitName={selectedUnit?.name} vehiclePlate={selectedVehicle?.plate} />
          </Step>
        ) : null}

        {step === STEP_CONFIRM && confirmation ? (
          <Step title="Assinatura criada" description="Seu checkout foi confirmado. Acompanhe a cobranca em Minhas Cobrancas." current={step} total={TOTAL_STEPS}>
            <SuccessContent confirmation={confirmation} copied={copied} onCopyPix={() => void copyPix()} />
          </Step>
        ) : null}

        <View className="gap-3">
          {step < STEP_PREVIEW ? <Button loading={previewMutation.isPending} onPress={() => void next()} title="Continuar" /> : null}
          {step === STEP_PREVIEW ? <Button loading={confirmMutation.isPending} onPress={() => void confirm()} title="Confirmar assinatura" /> : null}
          {step === STEP_CONFIRM ? <Button onPress={() => router.replace("/(tabs)/billing")} title="Ir para Minhas Cobranças" /> : null}
          {step > 1 && step < STEP_CONFIRM ? (
            <Button onPress={() => setStep((current) => Math.max(current - 1, 1))} title="Voltar" variant="ghost" />
          ) : null}
        </View>
      </View>
    </Screen>
  );
}

function Step({
  title,
  description,
  current,
  total,
  children
}: {
  title: string;
  description: string;
  current: number;
  total: number;
  children: React.ReactNode;
}) {
  return (
    <View className="gap-4">
      <StepHeader current={current} description={description} title={title} total={total} />
      {children}
    </View>
  );
}

function SuccessContent({
  confirmation,
  copied,
  onCopyPix
}: {
  confirmation: CheckoutConfirmResult;
  copied: boolean;
  onCopyPix: () => void;
}) {
  const record = asRecord(confirmation);
  const billingCycle = getNestedRecord(record, ["billingCycle"]);
  const pixCopyPaste = getString(record, ["pixCopyPaste"]) || getString(billingCycle, ["pixCopyPaste"]);
  const pixQrCode = getString(record, ["pixQrCode"]) || getString(billingCycle, ["pixQrCode"]);
  const paymentMethod = getString(record, ["paymentMethod"], "");
  const gatewayAmount = getNumber(record, ["gatewayAmount"], getNumber(billingCycle, ["gatewayAmount"], getNumber(record, ["value"], 0)));

  return (
    <Card>
      <View className="gap-3">
        <Text className="text-xl font-bold text-uau-black">Tudo certo por aqui.</Text>
        {gatewayAmount > 0 ? (
          <Text className="text-sm text-uau-gray">Valor a pagar (gateway): {gatewayAmount}</Text>
        ) : null}
        {paymentMethod ? <Text className="text-sm text-uau-gray">Metodo: {paymentMethod}</Text> : null}
        {pixQrCode || pixCopyPaste ? (
          <View className="gap-3 rounded-lg bg-uau-light p-3">
            <Text className="font-semibold text-uau-black">PIX</Text>
            {pixQrCode ? <Text className="text-xs leading-5 text-uau-gray">{pixQrCode}</Text> : null}
            {pixCopyPaste ? <Text className="text-xs leading-5 text-uau-gray">{pixCopyPaste}</Text> : null}
            <Button onPress={onCopyPix} title={copied ? "Codigo copiado" : "Copiar codigo PIX"} />
          </View>
        ) : null}
      </View>
    </Card>
  );
}
