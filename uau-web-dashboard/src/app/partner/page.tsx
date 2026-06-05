"use client";

import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/layout/DashboardLayout";
import { ProtectedRoute } from "@/layout/ProtectedRoute";
import { ErrorState, LoadingState } from "@/components/State";
import { MetricCard } from "@/components/MetricCard";
import { Section } from "@/components/Section";
import { MetricGrid } from "@/features/shared/MetricGrid";
import { SimpleList } from "@/features/shared/SimpleList";
import {
  getPartnerAlerts,
  getPartnerFinancial,
  getPartnerOverview,
  getPartnerTransactions,
} from "@/features/partner-dashboard/partner-dashboard.api";
import { asRecord, getNumber, normalizeList } from "@/utils/data";

export default function PartnerPage() {
  const overview = useQuery({ queryKey: ["partner", "overview"], queryFn: getPartnerOverview });
  const financial = useQuery({ queryKey: ["partner", "financial"], queryFn: getPartnerFinancial });
  const transactions = useQuery({ queryKey: ["partner", "transactions"], queryFn: getPartnerTransactions });
  const alerts = useQuery({ queryKey: ["partner", "alerts"], queryFn: getPartnerAlerts });
  const overviewData = asRecord(overview.data);
  const financialData = asRecord(financial.data);

  return (
    <ProtectedRoute roles={["PARTNER", "SUPER_ADMIN"]}>
      <DashboardLayout title="Meu Parceiro">
        <div className="space-y-8">
          {(overview.isLoading || financial.isLoading || transactions.isLoading || alerts.isLoading) ? <LoadingState /> : null}
          {(overview.error || financial.error || transactions.error || alerts.error) ? <ErrorState /> : null}
          <Section title="Overview">
            <MetricGrid>
              <MetricCard label="Parceiros ativos" value={getNumber(overviewData, ["activePartners"], 0)} />
              <MetricCard label="Transacoes" value={getNumber(overviewData, ["totalTransactions"], 0)} />
              <MetricCard label="Clientes" value={getNumber(overviewData, ["totalCustomersServed"], 0)} />
              <MetricCard money label="Ticket medio" value={getNumber(overviewData, ["averageTicket"], 0)} />
              <MetricCard money label="Vendas" value={getNumber(overviewData, ["totalGrossSales"], 0)} />
              <MetricCard money label="Cashback usado" value={getNumber(overviewData, ["totalCashbackUsed"], 0)} />
            </MetricGrid>
          </Section>
          <Section title="Financeiro">
            <MetricGrid>
              <MetricCard money label="Vendas brutas" value={getNumber(financialData, ["grossSales"], 0)} />
              <MetricCard money label="Gateway" value={getNumber(financialData, ["gatewayAmount"], 0)} />
              <MetricCard money label="Cashback aceito" value={getNumber(financialData, ["cashbackAcceptedAsDiscount"], 0)} />
              <MetricCard money label="Cashback gerado" value={getNumber(financialData, ["cashbackGenerated"], 0)} />
              <MetricCard money label="Comissao UAU" value={getNumber(financialData, ["uauCommissionAmount"], 0)} />
            </MetricGrid>
          </Section>
          <Section title="Transacoes">
            <SimpleList empty="Sem transacoes." items={normalizeList(transactions.data)} />
          </Section>
          <Section title="Alertas">
            <SimpleList empty="Sem alertas." items={normalizeList(alerts.data)} />
          </Section>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
