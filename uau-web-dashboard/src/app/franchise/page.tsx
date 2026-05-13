"use client";

import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/layout/DashboardLayout";
import { ProtectedRoute } from "@/layout/ProtectedRoute";
import { ErrorState, LoadingState } from "@/components/State";
import { MetricCard } from "@/components/MetricCard";
import { Section } from "@/components/Section";
import { MetricGrid } from "@/features/shared/MetricGrid";
import { SimpleList } from "@/features/shared/SimpleList";
import { getEndpoint } from "@/features/shared/dashboard.api";
import { asRecord, getNumber, normalizeList } from "@/utils/data";

export default function FranchisePage() {
  const overview = useQuery({ queryKey: ["franchise", "overview"], queryFn: () => getEndpoint("/franchise-dashboard/overview") });
  const financial = useQuery({ queryKey: ["franchise", "financial"], queryFn: () => getEndpoint("/franchise-dashboard/financial") });
  const operations = useQuery({ queryKey: ["franchise", "operations"], queryFn: () => getEndpoint("/franchise-dashboard/operations") });
  const alerts = useQuery({ queryKey: ["franchise", "alerts"], queryFn: () => getEndpoint("/franchise-dashboard/alerts") });
  const overviewData = asRecord(overview.data);
  const financialData = asRecord(financial.data);
  const operationsData = asRecord(operations.data);

  return (
    <ProtectedRoute roles={["FRANCHISE_OWNER", "SUPER_ADMIN"]}>
      <DashboardLayout title="Minha Franquia">
        <div className="space-y-8">
          {(overview.isLoading || financial.isLoading || operations.isLoading || alerts.isLoading) ? <LoadingState /> : null}
          {(overview.error || financial.error || operations.error || alerts.error) ? <ErrorState /> : null}
          <Section title="Overview">
            <MetricGrid>
              <MetricCard label="Unidades" value={getNumber(overviewData, ["totalUnits"], 0)} />
              <MetricCard label="Clientes" value={getNumber(overviewData, ["totalCustomers"], 0)} />
              <MetricCard label="Assinaturas ativas" value={getNumber(overviewData, ["activeSubscriptions"], 0)} />
              <MetricCard label="Inadimplentes" value={getNumber(overviewData, ["overdueSubscriptions"], 0)} />
            </MetricGrid>
          </Section>
          <Section title="Financeiro">
            <MetricGrid>
              <MetricCard money label="Receita estimada" value={getNumber(financialData, ["estimatedFranchiseRevenue"], 0)} />
              <MetricCard money label="Gateway" value={getNumber(financialData, ["totalGatewayAmount"], 0)} />
              <MetricCard money label="Cashback usado" value={getNumber(financialData, ["totalCashbackUsedInSubscriptions"], 0)} />
              <MetricCard money label="Comissao parceiros" value={getNumber(financialData, ["totalPartnerUauCommission"], 0)} />
            </MetricGrid>
          </Section>
          <Section title="Operacao">
            <MetricGrid>
              <MetricCard label="Shifts abertos" value={getNumber(operationsData, ["openShifts"], 0)} />
              <MetricCard label="Atendimentos hoje" value={getNumber(operationsData, ["totalAttendancesToday"], 0)} />
              <MetricCard label="Plano" value={getNumber(operationsData, ["totalPlanAttendancesToday"], 0)} />
              <MetricCard label="Avulso" value={getNumber(operationsData, ["totalAvulsoAttendancesToday"], 0)} />
            </MetricGrid>
          </Section>
          <Section title="Alertas">
            <SimpleList empty="Sem alertas." items={normalizeList(alerts.data)} />
          </Section>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
