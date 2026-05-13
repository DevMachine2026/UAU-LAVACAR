import { useQueryClient } from "@tanstack/react-query";
import { Pressable, Text, View } from "react-native";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { Loading } from "@/components/Loading";
import { Screen } from "@/components/Screen";
import { useAuthStore } from "@/auth/auth.store";
import { PartnerDashboardAlertCard } from "@/features/partner-dashboard/PartnerDashboardAlertCard";
import { PartnerDashboardCampaignCard } from "@/features/partner-dashboard/PartnerDashboardCampaignCard";
import { PartnerDashboardCustomerCard } from "@/features/partner-dashboard/PartnerDashboardCustomerCard";
import { PartnerDashboardMetricCard } from "@/features/partner-dashboard/PartnerDashboardMetricCard";
import { PartnerDashboardSection } from "@/features/partner-dashboard/PartnerDashboardSection";
import { PartnerDashboardTransactionCard } from "@/features/partner-dashboard/PartnerDashboardTransactionCard";
import {
  usePartnerAlerts,
  usePartnerCampaigns,
  usePartnerCustomers,
  usePartnerFinancial,
  usePartnerOverview,
  usePartnerTransactions
} from "@/features/partner-dashboard/partnerDashboard.hooks";
import { asArray, asRecord, getNumber } from "@/utils/data";

const ALLOWED_ROLES = ["PARTNER", "SUPER_ADMIN"];

function normalizeList(value: unknown) {
  if (Array.isArray(value)) return value;
  const record = asRecord(value);
  return asArray(record.items ?? record.data ?? record.transactions ?? record.campaigns ?? record.customers ?? record.alerts);
}

export default function PartnerDashboardScreen() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const overviewQuery = usePartnerOverview();
  const financialQuery = usePartnerFinancial();
  const transactionsQuery = usePartnerTransactions();
  const campaignsQuery = usePartnerCampaigns();
  const customersQuery = usePartnerCustomers();
  const alertsQuery = usePartnerAlerts();
  const allowed = user?.role ? ALLOWED_ROLES.includes(user.role) : false;

  const overview = asRecord(overviewQuery.data);
  const financial = asRecord(financialQuery.data);
  const transactions = normalizeList(transactionsQuery.data);
  const campaigns = normalizeList(campaignsQuery.data);
  const customers = normalizeList(customersQuery.data);
  const alerts = normalizeList(alertsQuery.data);
  const isLoading =
    overviewQuery.isLoading ||
    financialQuery.isLoading ||
    transactionsQuery.isLoading ||
    campaignsQuery.isLoading ||
    customersQuery.isLoading ||
    alertsQuery.isLoading;
  const hasError =
    overviewQuery.error ||
    financialQuery.error ||
    transactionsQuery.error ||
    campaignsQuery.error ||
    customersQuery.error ||
    alertsQuery.error;

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: ["partner-dashboard"] });
  }

  if (!allowed) {
    return (
      <Screen>
        <View className="gap-5">
          <Text className="text-3xl font-bold text-uau-black">Meu Parceiro</Text>
          <EmptyState title="Sem permissao" description="Esta area e exclusiva para PARTNER ou SUPER_ADMIN." />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View className="gap-6 pb-8">
        <View className="gap-2">
          <Text className="text-3xl font-bold text-uau-black">Meu Parceiro</Text>
          <Text className="text-base leading-6 text-uau-gray">
            Vendas, cashback aceito, campanhas, clientes e alertas dos parceiros vinculados.
          </Text>
        </View>

        <View className="flex-row gap-3">
          <PeriodChip label="Hoje" active />
          <PeriodChip label="Mes" />
          <Button onPress={refresh} title="Atualizar" variant="ghost" />
        </View>

        {isLoading ? <Loading /> : null}
        {hasError ? <ErrorState message="Nao foi possivel carregar todos os indicadores do parceiro agora." /> : null}

        <Card>
          <Text className="text-sm leading-5 text-uau-gray">
            Cashback aceito e desconto operacional do parceiro e nao gera divida da UAU.
          </Text>
        </Card>

        <PartnerDashboardSection title="Overview">
          <MetricGrid>
            <PartnerDashboardMetricCard label="Parceiros vinculados" value={getNumber(overview, ["totalPartnersLinked"], 0)} />
            <PartnerDashboardMetricCard label="Parceiros ativos" value={getNumber(overview, ["activePartners"], 0)} />
            <PartnerDashboardMetricCard label="Transacoes" value={getNumber(overview, ["totalTransactions"], 0)} />
            <PartnerDashboardMetricCard label="Clientes atendidos" value={getNumber(overview, ["totalCustomersServed"], 0)} />
            <PartnerDashboardMetricCard money label="Ticket medio" value={getNumber(overview, ["averageTicket"], 0)} />
            <PartnerDashboardMetricCard money label="Vendas totais" value={getNumber(overview, ["totalGrossSales"], 0)} />
            <PartnerDashboardMetricCard money label="Cashback usado" value={getNumber(overview, ["totalCashbackUsed"], 0)} />
          </MetricGrid>
        </PartnerDashboardSection>

        <PartnerDashboardSection title="Financeiro">
          <MetricGrid>
            <PartnerDashboardMetricCard money label="Vendas brutas" value={getNumber(financial, ["grossSales"], 0)} />
            <PartnerDashboardMetricCard money label="Gateway" value={getNumber(financial, ["gatewayAmount"], 0)} />
            <PartnerDashboardMetricCard money label="Cashback desconto" value={getNumber(financial, ["cashbackAcceptedAsDiscount"], 0)} />
            <PartnerDashboardMetricCard money label="Cashback gerado" value={getNumber(financial, ["cashbackGenerated"], 0)} />
            <PartnerDashboardMetricCard money label="Cashback cliente" value={getNumber(financial, ["customerCashbackAmount"], 0)} />
            <PartnerDashboardMetricCard money label="Comissao UAU" value={getNumber(financial, ["uauCommissionAmount"], 0)} />
            <PartnerDashboardMetricCard money label="Ticket medio" value={getNumber(financial, ["averageTicket"], 0)} />
          </MetricGrid>
        </PartnerDashboardSection>

        <PartnerDashboardSection title="Transacoes">
          {transactions.length === 0 && !transactionsQuery.isLoading ? (
            <EmptyState title="Sem transacoes" description="As vendas confirmadas aparecerao aqui." />
          ) : null}
          {transactions.slice(0, 10).map((transaction, index) => (
            <PartnerDashboardTransactionCard transaction={transaction} key={String(asRecord(transaction).id ?? index)} />
          ))}
        </PartnerDashboardSection>

        <PartnerDashboardSection title="Campanhas">
          {campaigns.length === 0 && !campaignsQuery.isLoading ? (
            <EmptyState title="Sem campanhas" description="Campanhas do parceiro aparecerao aqui." />
          ) : null}
          {campaigns.slice(0, 10).map((campaign, index) => (
            <PartnerDashboardCampaignCard campaign={campaign} key={String(asRecord(campaign).id ?? index)} />
          ))}
        </PartnerDashboardSection>

        <PartnerDashboardSection title="Clientes">
          {customers.length === 0 && !customersQuery.isLoading ? (
            <EmptyState title="Sem clientes" description="Clientes atendidos pelo parceiro aparecerao aqui." />
          ) : null}
          {customers.slice(0, 10).map((customer, index) => (
            <PartnerDashboardCustomerCard customer={customer} key={String(asRecord(customer).id ?? index)} />
          ))}
        </PartnerDashboardSection>

        <PartnerDashboardSection title="Alertas">
          {alerts.length === 0 && !alertsQuery.isLoading ? (
            <EmptyState title="Sem alertas" description="Quando houver algo importante para o parceiro, aparecera aqui." />
          ) : null}
          {alerts.slice(0, 10).map((alert, index) => (
            <PartnerDashboardAlertCard alert={alert} key={String(asRecord(alert).id ?? index)} />
          ))}
        </PartnerDashboardSection>
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
