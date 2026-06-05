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
  getAdminAlerts,
  getAdminFinancial,
  getAdminOverview,
} from "@/features/admin-dashboard/admin-dashboard.api";
import { asRecord, getNumber, normalizeList } from "@/utils/data";

export default function AdminPage() {
  const overview = useQuery({ queryKey: ["admin", "overview"], queryFn: getAdminOverview });
  const financial = useQuery({ queryKey: ["admin", "financial"], queryFn: getAdminFinancial });
  const alerts = useQuery({ queryKey: ["admin", "alerts"], queryFn: getAdminAlerts });
  const overviewData = asRecord(overview.data);
  const financialData = asRecord(financial.data);

  return (
    <ProtectedRoute roles={["SUPER_ADMIN"]}>
      <DashboardLayout title="Super Admin">
        <div className="space-y-8">
          {(overview.isLoading || financial.isLoading || alerts.isLoading) ? <LoadingState /> : null}
          {(overview.error || financial.error || alerts.error) ? <ErrorState /> : null}
          <Section title="Geral">
            <MetricGrid>
              <MetricCard label="Usuarios" value={getNumber(overviewData, ["totalUsers"], 0)} />
              <MetricCard label="Clientes" value={getNumber(overviewData, ["totalCustomers"], 0)} />
              <MetricCard label="Assinaturas ativas" value={getNumber(overviewData, ["activeSubscriptions"], 0)} />
              <MetricCard label="Cobrancas abertas" value={getNumber(overviewData, ["openBillingCycles"], 0)} />
              <MetricCard label="Parceiros" value={getNumber(overviewData, ["totalPartners"], 0)} />
              <MetricCard label="Unidades" value={getNumber(overviewData, ["totalUnits"], 0)} />
            </MetricGrid>
          </Section>
          <Section title="Financeiro">
            <MetricGrid>
              <MetricCard money label="Receita billing" value={getNumber(financialData, ["totalGatewayAmount", "totalBaseAmountBilling"], 0)} />
              <MetricCard money label="Cashback circulacao" value={getNumber(financialData, ["totalCashbackInCirculation"], 0)} />
              <MetricCard money label="Wallet disponivel" value={getNumber(financialData, ["totalWalletAvailableBalance"], 0)} />
              <MetricCard money label="Comissao parceiros" value={getNumber(financialData, ["totalPartnerUauCommission"], 0)} />
            </MetricGrid>
          </Section>
          <Section title="Alertas">
            <SimpleList empty="Sem alertas relevantes." items={normalizeList(alerts.data)} />
          </Section>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
