import { useQueryClient } from "@tanstack/react-query";
import { Pressable, Text, View } from "react-native";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { Loading } from "@/components/Loading";
import { Screen } from "@/components/Screen";
import { useAuthStore } from "@/auth/auth.store";
import { FranchiseAlertCard } from "@/features/franchise/FranchiseAlertCard";
import { FranchiseCustomerCard } from "@/features/franchise/FranchiseCustomerCard";
import { FranchiseMetricCard } from "@/features/franchise/FranchiseMetricCard";
import { FranchiseSection } from "@/features/franchise/FranchiseSection";
import {
  useFranchiseAlerts,
  useFranchiseAnpr,
  useFranchiseCustomers,
  useFranchiseFinancial,
  useFranchiseOperations,
  useFranchiseOverview,
  useFranchisePartners
} from "@/features/franchise/franchise.hooks";
import { asArray, asRecord, getNumber } from "@/utils/data";

const ALLOWED_ROLES = ["FRANCHISE_OWNER", "SUPER_ADMIN"];

function normalizeList(value: unknown) {
  if (Array.isArray(value)) return value;
  const record = asRecord(value);
  return asArray(record.items ?? record.data ?? record.alerts ?? record.customers);
}

export default function FranchiseScreen() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const overviewQuery = useFranchiseOverview();
  const financialQuery = useFranchiseFinancial();
  const operationsQuery = useFranchiseOperations();
  const anprQuery = useFranchiseAnpr();
  const partnersQuery = useFranchisePartners();
  const customersQuery = useFranchiseCustomers();
  const alertsQuery = useFranchiseAlerts();
  const allowed = user?.role ? ALLOWED_ROLES.includes(user.role) : false;

  const overview = asRecord(overviewQuery.data);
  const financial = asRecord(financialQuery.data);
  const operations = asRecord(operationsQuery.data);
  const anpr = asRecord(anprQuery.data);
  const partners = asRecord(partnersQuery.data);
  const customers = normalizeList(customersQuery.data);
  const alerts = normalizeList(alertsQuery.data);

  const isLoading =
    overviewQuery.isLoading ||
    financialQuery.isLoading ||
    operationsQuery.isLoading ||
    anprQuery.isLoading ||
    partnersQuery.isLoading ||
    customersQuery.isLoading ||
    alertsQuery.isLoading;

  const hasError =
    overviewQuery.error ||
    financialQuery.error ||
    operationsQuery.error ||
    anprQuery.error ||
    partnersQuery.error ||
    customersQuery.error ||
    alertsQuery.error;

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: ["franchise"] });
  }

  if (!allowed) {
    return (
      <Screen>
        <View className="gap-5">
          <Text className="text-3xl font-bold text-uau-black">Minha Franquia</Text>
          <EmptyState title="Sem permissao" description="Esta area e exclusiva para FRANCHISE_OWNER ou SUPER_ADMIN." />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View className="gap-6 pb-8">
        <View className="gap-2">
          <Text className="text-3xl font-bold text-uau-black">Minha Franquia</Text>
          <Text className="text-base leading-6 text-uau-gray">
            Indicadores das suas unidades, clientes, operacao, ANPR e parceiros.
          </Text>
        </View>

        <View className="flex-row gap-3">
          <PeriodChip label="Hoje" active />
          <PeriodChip label="Mes" />
          <Button onPress={refresh} title="Atualizar" variant="ghost" />
        </View>

        {isLoading ? <Loading /> : null}
        {hasError ? <ErrorState message="Nao foi possivel carregar todos os indicadores da franquia agora." /> : null}

        <FranchiseSection title="Overview">
          <MetricGrid>
            <FranchiseMetricCard label="Unidades" value={getNumber(overview, ["totalUnits"], 0)} />
            <FranchiseMetricCard label="Clientes" value={getNumber(overview, ["totalCustomers"], 0)} />
            <FranchiseMetricCard label="Assinaturas ativas" value={getNumber(overview, ["activeSubscriptions"], 0)} />
            <FranchiseMetricCard label="Inadimplentes" value={getNumber(overview, ["overdueSubscriptions"], 0)} />
            <FranchiseMetricCard label="Cobrancas abertas" value={getNumber(overview, ["openBillingCycles"], 0)} />
          </MetricGrid>
        </FranchiseSection>

        <FranchiseSection title="Financeiro">
          <MetricGrid>
            <FranchiseMetricCard money label="Receita estimada" value={getNumber(financial, ["estimatedFranchiseRevenue"], 0)} />
            <FranchiseMetricCard money label="Gateway amount" value={getNumber(financial, ["totalGatewayAmount"], 0)} />
            <FranchiseMetricCard money label="Cashback usado" value={getNumber(financial, ["totalCashbackUsedInSubscriptions", "totalPartnerCashbackUsed"], 0)} />
            <FranchiseMetricCard money label="Comissao parceiros" value={getNumber(financial, ["totalPartnerUauCommission"], 0)} />
            <FranchiseMetricCard money label="Repasse estimado" value={getNumber(financial, ["estimatedFranchiseRevenue"], 0)} />
          </MetricGrid>
        </FranchiseSection>

        <FranchiseSection title="Operacao">
          <MetricGrid>
            <FranchiseMetricCard label="Shifts abertos" value={getNumber(operations, ["openShifts"], 0)} />
            <FranchiseMetricCard label="Atendimentos hoje" value={getNumber(operations, ["totalAttendancesToday"], 0)} />
            <FranchiseMetricCard label="Plano" value={getNumber(operations, ["totalPlanAttendancesToday"], 0)} />
            <FranchiseMetricCard label="Avulso" value={getNumber(operations, ["totalAvulsoAttendancesToday"], 0)} />
            <FranchiseMetricCard label="Bloqueados" value={getNumber(operations, ["totalBlockedAttendancesToday"], 0)} />
            <FranchiseMetricCard label="Divergencias" value={getNumber(operations, ["totalDivergencesToday"], 0)} />
          </MetricGrid>
        </FranchiseSection>

        <FranchiseSection title="ANPR">
          <MetricGrid>
            <FranchiseMetricCard label="Eventos hoje" value={getNumber(anpr, ["totalAnprEventsToday"], 0)} />
            <FranchiseMetricCard label="Autorizados" value={getNumber(anpr, ["authorizedToday"], 0)} />
            <FranchiseMetricCard label="Bloqueados" value={getNumber(anpr, ["blockedToday"], 0)} />
            <FranchiseMetricCard label="Desconhecidos" value={getNumber(anpr, ["unknownToday"], 0)} />
            <FranchiseMetricCard label="Suspeitos" value={getNumber(anpr, ["suspectToday"], 0)} />
          </MetricGrid>
        </FranchiseSection>

        <FranchiseSection title="Parceiros">
          <MetricGrid>
            <FranchiseMetricCard label="Parceiros ativos" value={getNumber(partners, ["activePartners"], 0)} />
            <FranchiseMetricCard money label="Vendas" value={getNumber(partners, ["totalPartnerSales"], 0)} />
            <FranchiseMetricCard money label="Cashback aceito" value={getNumber(partners, ["totalCashbackAcceptedByPartners"], 0)} />
            <FranchiseMetricCard money label="Comissao" value={getNumber(partners, ["totalUauCommissionFromPartners"], 0)} />
          </MetricGrid>
        </FranchiseSection>

        <FranchiseSection title="Clientes">
          {customers.length === 0 && !customersQuery.isLoading ? (
            <EmptyState title="Nenhum cliente encontrado" description="Clientes vinculados as suas unidades aparecerao aqui." />
          ) : null}
          {customers.slice(0, 8).map((customer, index) => (
            <FranchiseCustomerCard customer={customer} key={String(asRecord(customer).id ?? index)} />
          ))}
        </FranchiseSection>

        <FranchiseSection title="Alertas">
          {alerts.length === 0 && !alertsQuery.isLoading ? (
            <EmptyState title="Sem alertas" description="Quando houver algo importante na franquia, aparecera aqui." />
          ) : null}
          {alerts.slice(0, 10).map((alert, index) => (
            <FranchiseAlertCard alert={alert} key={String(asRecord(alert).id ?? index)} />
          ))}
        </FranchiseSection>
      </View>
    </Screen>
  );
}

function MetricGrid({ children }: { children: React.ReactNode }) {
  return <View className="flex-row flex-wrap gap-3">{children}</View>;
}

function PeriodChip({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <Pressable className={`h-12 justify-center rounded-lg px-4 ${active ? "bg-uau-green" : "bg-white"}`}>
      <Text className={`font-semibold ${active ? "text-white" : "text-uau-black"}`}>{label}</Text>
    </Pressable>
  );
}
