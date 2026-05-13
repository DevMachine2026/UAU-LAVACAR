import * as Clipboard from "expo-clipboard";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Text, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { Input } from "@/components/Input";
import { Loading } from "@/components/Loading";
import { Screen } from "@/components/Screen";
import {
  CheckoutConfirmResult,
  CheckoutPreview,
  SubscriptionCheckoutPayload,
  confirmSubscription,
  previewSubscription
} from "@/features/checkout/checkout.api";
import { getCities, getFranchiseUnits, getStates, LocationItem } from "@/features/locations/locations.api";
import { getPlans, Plan } from "@/features/plans/plans.api";
import { CheckoutSummary } from "@/features/subscribe/CheckoutSummary";
import { PaymentMethodCard } from "@/features/subscribe/PaymentMethodCard";
import { PlanCard } from "@/features/subscribe/PlanCard";
import { SelectCard } from "@/features/subscribe/SelectCard";
import { StepHeader } from "@/features/subscribe/StepHeader";
import { createVehicle, getVehicles, Vehicle } from "@/features/vehicles/vehicles.api";
import { asArray, asRecord, getNestedRecord, getNumber, getString } from "@/utils/data";

const TOTAL_STEPS = 8;

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
  const [selectedState, setSelectedState] = useState<LocationItem | null>(null);
  const [selectedCity, setSelectedCity] = useState<LocationItem | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<LocationItem | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"PIX" | "CREDIT_CARD" | null>(null);
  const [preview, setPreview] = useState<CheckoutPreview | null>(null);
  const [confirmation, setConfirmation] = useState<CheckoutConfirmResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [vehicleForm, setVehicleForm] = useState({ plate: "", brand: "", model: "", color: "" });

  const statesQuery = useQuery({ queryKey: ["locations", "states"], queryFn: getStates });
  const citiesQuery = useQuery({ queryKey: ["locations", "cities"], queryFn: getCities });
  const unitsQuery = useQuery({ queryKey: ["locations", "units"], queryFn: getFranchiseUnits });
  const plansQuery = useQuery({ queryKey: ["plans"], queryFn: getPlans });
  const vehiclesQuery = useQuery({ queryKey: ["vehicles", "me"], queryFn: getVehicles });

  const states = useMemo(() => normalizeList<LocationItem>(statesQuery.data).filter(isActiveItem), [statesQuery.data]);
  const cities = useMemo(() => {
    return normalizeList<LocationItem>(citiesQuery.data)
      .filter(isActiveItem)
      .filter((city) => !selectedState || asRecord(city).stateId === selectedState.id);
  }, [citiesQuery.data, selectedState]);
  const units = useMemo(() => {
    return normalizeList<LocationItem>(unitsQuery.data)
      .filter(isActiveItem)
      .filter((unit) => !selectedCity || asRecord(unit).cityId === selectedCity.id);
  }, [selectedCity, unitsQuery.data]);
  const plans = useMemo(() => normalizeList<Plan>(plansQuery.data).filter(isActiveItem), [plansQuery.data]);
  const vehicles = useMemo(() => normalizeList<Vehicle>(vehiclesQuery.data).filter(isActiveItem), [vehiclesQuery.data]);

  const createVehicleMutation = useMutation({
    mutationFn: createVehicle,
    onSuccess: (vehicle) => {
      setSelectedVehicle(vehicle);
      setVehicleForm({ plate: "", brand: "", model: "", color: "" });
      void queryClient.invalidateQueries({ queryKey: ["vehicles", "me"] });
    }
  });
  const previewMutation = useMutation({ mutationFn: previewSubscription });
  const confirmMutation = useMutation({ mutationFn: confirmSubscription });

  const isLoading =
    statesQuery.isLoading || citiesQuery.isLoading || unitsQuery.isLoading || plansQuery.isLoading || vehiclesQuery.isLoading;
  const queryError = statesQuery.error || citiesQuery.error || unitsQuery.error || plansQuery.error || vehiclesQuery.error;

  function payload(): SubscriptionCheckoutPayload | null {
    if (!selectedPlan || !selectedVehicle || !paymentMethod) return null;
    return {
      stateId: selectedState?.id,
      cityId: selectedCity?.id,
      unitId: selectedUnit?.id,
      planId: selectedPlan.id,
      vehicleId: selectedVehicle.id,
      paymentMethod
    };
  }

  function validateCurrentStep() {
    if (step === 1 && !selectedState) return "Escolha um estado para continuar.";
    if (step === 2 && !selectedCity) return "Escolha uma cidade para continuar.";
    if (step === 3 && !selectedUnit) return "Escolha uma unidade para continuar.";
    if (step === 4 && !selectedPlan) return "Escolha um plano para continuar.";
    if (step === 5 && !selectedVehicle) return "Escolha ou cadastre um veiculo para continuar.";
    if (step === 6 && !paymentMethod) return "Escolha uma forma de pagamento para continuar.";
    return null;
  }

  async function next() {
    setError(null);
    const validation = validateCurrentStep();
    if (validation) {
      setError(validation);
      return;
    }

    if (step === 6) {
      const checkoutPayload = payload();
      if (!checkoutPayload) return;
      try {
        const result = await previewMutation.mutateAsync(checkoutPayload);
        setPreview(result);
        setStep(7);
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
      setStep(8);
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
    <Screen>
      <View className="gap-6 pb-8">
        {isLoading ? <Loading /> : null}
        {queryError ? <ErrorState message="Nao foi possivel carregar os dados do checkout agora." /> : null}
        {error ? <ErrorState title="Atencao" message={error} /> : null}

        {step === 1 ? (
          <Step title="Estado" description="Escolha onde voce quer usar o UAU+." current={step}>
            {states.map((state) => (
              <SelectCard
                key={state.id}
                onPress={() => {
                  setSelectedState(state);
                  setSelectedCity(null);
                  setSelectedUnit(null);
                }}
                selected={selectedState?.id === state.id}
                title={state.name}
              />
            ))}
          </Step>
        ) : null}

        {step === 2 ? (
          <Step title="Cidade" description="Agora escolha a cidade da sua assinatura." current={step}>
            {cities.map((city) => (
              <SelectCard
                key={city.id}
                onPress={() => {
                  setSelectedCity(city);
                  setSelectedUnit(null);
                }}
                selected={selectedCity?.id === city.id}
                title={city.name}
              />
            ))}
          </Step>
        ) : null}

        {step === 3 ? (
          <Step title="Unidade" description="Escolha sua unidade principal. Planos nacionais continuam podendo usar outras unidades conforme regra do plano." current={step}>
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

        {step === 4 ? (
          <Step title="Plano" description="Escolha o plano ideal para sua rotina." current={step}>
            {plans.map((plan) => (
              <PlanCard key={plan.id} onPress={() => setSelectedPlan(plan)} plan={plan} selected={selectedPlan?.id === plan.id} />
            ))}
          </Step>
        ) : null}

        {step === 5 ? (
          <Step title="Veiculo" description="Escolha um veiculo cadastrado ou cadastre um novo." current={step}>
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

        {step === 6 ? (
          <Step title="Forma de pagamento" description="O cashback sera aplicado automaticamente conforme as regras do UAU+." current={step}>
            <PaymentMethodCard
              description="Usa cashback disponivel e gera PIX para pagar o restante."
              onPress={() => setPaymentMethod("PIX")}
              selected={paymentMethod === "PIX"}
              title="Cashback + PIX"
            />
            <PaymentMethodCard
              description="Usa cashback disponivel e prepara pagamento do restante no cartao."
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

        {step === 7 && preview ? (
          <Step title="Preview" description="Confira os valores antes de confirmar." current={step}>
            <CheckoutSummary preview={preview} unitName={selectedUnit?.name} vehiclePlate={selectedVehicle?.plate} />
          </Step>
        ) : null}

        {step === 8 && confirmation ? (
          <Step title="Assinatura criada" description="Seu checkout foi confirmado. Acompanhe a cobranca em Minhas Cobrancas." current={step}>
            <SuccessContent confirmation={confirmation} copied={copied} onCopyPix={() => void copyPix()} />
          </Step>
        ) : null}

        <View className="gap-3">
          {step < 7 ? <Button loading={previewMutation.isPending} onPress={() => void next()} title="Continuar" /> : null}
          {step === 7 ? <Button loading={confirmMutation.isPending} onPress={() => void confirm()} title="Confirmar assinatura" /> : null}
          {step === 8 ? <Button onPress={() => router.replace("/(tabs)/billing")} title="Ir para Minhas Cobrancas" /> : null}
          {step > 1 && step < 8 ? (
            <Button onPress={() => setStep((current) => Math.max(current - 1, 1))} title="Voltar" variant="ghost" />
          ) : null}
        </View>
      </View>
    </Screen>
  );
}

function Step({ title, description, current, children }: { title: string; description: string; current: number; children: React.ReactNode }) {
  return (
    <View className="gap-4">
      <StepHeader current={current} description={description} title={title} total={TOTAL_STEPS} />
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

  return (
    <Card>
      <View className="gap-3">
        <Text className="text-xl font-bold text-uau-black">Tudo certo por aqui.</Text>
        {getNumber(record, ["value"], 0) > 0 ? (
          <Text className="text-sm text-uau-gray">Valor gateway: {getNumber(record, ["value"], 0)}</Text>
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
