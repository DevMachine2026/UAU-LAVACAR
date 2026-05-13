"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { ErrorState, LoadingState } from "@/components/State";
import {
  BillingHistoryTable,
  CustomerDetailTabs,
  CustomerStatusBadge,
  VehicleList,
  WalletStatementTable,
  WashHistoryTable,
  customerName,
  formatDate,
  maskCpf,
  maskPhone,
  money,
} from "@/features/customers/components";
import {
  getBillingHistory,
  getCustomer,
  getVehicles,
  getWallet,
  getWalletStatement,
  getWashHistory,
  listItems,
} from "@/features/customers/customers.api";
import { DashboardLayout } from "@/layout/DashboardLayout";
import { ProtectedRoute } from "@/layout/ProtectedRoute";

type Tab = "Perfil" | "Veiculos" | "Assinatura/Cobrancas" | "Wallet/Extrato" | "Historico de lavagens" | "Suporte";
const tabs: Tab[] = ["Perfil", "Veiculos", "Assinatura/Cobrancas", "Wallet/Extrato", "Historico de lavagens", "Suporte"];

export default function FranchiseCustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const customerId = params.id;
  const [tab, setTab] = useState<Tab>("Perfil");
  const [notice, setNotice] = useState("");

  const customer = useQuery({ queryKey: ["franchise-customer", customerId], queryFn: () => getCustomer(customerId) });
  const vehicles = useQuery({ queryKey: ["franchise-customer-vehicles", customerId], queryFn: () => getVehicles(customerId) });
  const wallet = useQuery({ queryKey: ["franchise-customer-wallet", customerId], queryFn: () => getWallet(customerId) });
  const statement = useQuery({ queryKey: ["franchise-customer-wallet-statement", customerId], queryFn: () => getWalletStatement(customerId) });
  const billing = useQuery({ queryKey: ["franchise-customer-billing", customerId], queryFn: () => getBillingHistory(customerId) });
  const washes = useQuery({ queryKey: ["franchise-customer-washes", customerId], queryFn: () => getWashHistory(customerId) });
  const data = customer.data;

  return (
    <ProtectedRoute roles={["FRANCHISE_OWNER", "SUPER_ADMIN"]}>
      <DashboardLayout title="Cliente da Franquia">
        <div className="space-y-6">
          {customer.isLoading ? <LoadingState /> : null}
          {customer.error ? <ErrorState /> : null}
          {notice ? <Card className="border-emerald-200 text-emerald-800">{notice}</Card> : null}

          {data ? (
            <>
              <Card>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-uau-gray">Cliente</p>
                    <p className="text-2xl font-bold text-uau-black">{customerName(data)}</p>
                    <p className="text-sm text-uau-gray">{data.email ?? "-"}</p>
                  </div>
                  <CustomerStatusBadge status={data.status} />
                </div>
              </Card>
              <CustomerDetailTabs tabs={tabs} active={tab} onChange={(value) => setTab(value as Tab)} />

              {tab === "Perfil" ? (
                <Card>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <Info label="Nome" value={customerName(data)} />
                    <Info label="CPF" value={maskCpf(data.cpf ?? data.document)} />
                    <Info label="Telefone" value={maskPhone(data.phone)} />
                    <Info label="Status" value={data.status ?? "-"} />
                    <Info label="Unidade padrao" value={data.defaultUnit?.name ?? data.unit?.name ?? data.defaultUnitId ?? "-"} />
                    <Info label="Criado em" value={formatDate(data.createdAt)} />
                  </div>
                </Card>
              ) : null}

              {tab === "Veiculos" ? <VehicleList vehicles={listItems(vehicles.data)} /> : null}

              {tab === "Assinatura/Cobrancas" ? (
                <div className="space-y-4">
                  <Card>
                    <div className="grid gap-4 md:grid-cols-4">
                      <Info label="Status" value={data.subscription?.status ?? data.subscriptionStatus ?? "-"} />
                      <Info label="Plano" value={data.subscription?.plan?.name ?? data.subscription?.planId ?? "-"} />
                      <Info label="Valor base" value={money(data.subscription?.baseAmount ?? data.subscription?.amount ?? data.subscription?.plan?.price)} />
                      <Info label="Proximo vencimento" value={formatDate(data.subscription?.nextDueDate)} />
                    </div>
                  </Card>
                  <BillingHistoryTable items={listItems(billing.data)} />
                </div>
              ) : null}

              {tab === "Wallet/Extrato" ? <WalletStatementTable wallet={wallet.data} items={listItems(statement.data)} /> : null}
              {tab === "Historico de lavagens" ? <WashHistoryTable items={listItems(washes.data)} /> : null}
              {tab === "Suporte" ? (
                <Card>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Info label="ID do cliente" value={customerId} />
                    <Info label="Email" value={data.email ?? "-"} />
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Button type="button" variant="ghost" onClick={() => {
                      void navigator.clipboard?.writeText(customerId);
                      setNotice("ID copiado.");
                    }}>Copiar ID</Button>
                  </div>
                  <div className="mt-5 rounded-lg border border-dashed border-gray-300 p-4 text-sm text-uau-gray">
                    Visualizacao de suporte basico para franqueado. Acoes globais de bloqueio ficam restritas ao Super Admin.
                  </div>
                </Card>
              ) : null}
            </>
          ) : null}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <p className="text-xs font-semibold uppercase text-uau-gray">{label}</p>
      <p className="mt-1 break-words font-bold text-uau-black">{value || "-"}</p>
    </div>
  );
}
