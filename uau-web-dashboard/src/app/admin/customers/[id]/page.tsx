"use client";

import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { ErrorState, LoadingState } from "@/components/State";
import { ConfirmDialog } from "@/features/crud/ConfirmDialog";
import { FormField } from "@/features/crud/FormField";
import { FormModal } from "@/features/crud/FormModal";
import { SelectField } from "@/features/crud/SelectField";
import { errorMessage } from "@/features/crud/feedback";
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
  Customer,
  activateCustomer,
  blockCustomer,
  getBillingHistory,
  getCustomer,
  getReferralSummary,
  getReferralTree,
  getVehicles,
  getWallet,
  getWalletStatement,
  getWashHistory,
  listItems,
  markCustomerSuspect,
  updateCustomer,
} from "@/features/customers/customers.api";
import { getUnits } from "@/features/locations/locations.api";
import { DashboardLayout } from "@/layout/DashboardLayout";
import { ProtectedRoute } from "@/layout/ProtectedRoute";

type Tab = "Perfil" | "Veiculos" | "Assinatura/Cobrancas" | "Wallet/Extrato" | "Historico de lavagens" | "Rede/MMN" | "Suporte";
type ProfileForm = { name: string; email: string; phone: string; defaultUnitId: string };
const tabs: Tab[] = ["Perfil", "Veiculos", "Assinatura/Cobrancas", "Wallet/Extrato", "Historico de lavagens", "Rede/MMN", "Suporte"];

export default function AdminCustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const customerId = params.id;
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("Perfil");
  const [profileForm, setProfileForm] = useState<ProfileForm | null>(null);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const customer = useQuery({ queryKey: ["customer", customerId], queryFn: () => getCustomer(customerId) });
  const vehicles = useQuery({ queryKey: ["customer-vehicles", customerId], queryFn: () => getVehicles(customerId) });
  const wallet = useQuery({ queryKey: ["customer-wallet", customerId], queryFn: () => getWallet(customerId) });
  const statement = useQuery({ queryKey: ["customer-wallet-statement", customerId], queryFn: () => getWalletStatement(customerId) });
  const billing = useQuery({ queryKey: ["customer-billing", customerId], queryFn: () => getBillingHistory(customerId) });
  const washes = useQuery({ queryKey: ["customer-washes", customerId], queryFn: () => getWashHistory(customerId) });
  const referrals = useQuery({ queryKey: ["customer-referrals", customerId], queryFn: () => getReferralSummary(customerId) });
  const referralTree = useQuery({ queryKey: ["customer-referral-tree", customerId], queryFn: () => getReferralTree(customerId) });
  const units = useQuery({ queryKey: ["units"], queryFn: getUnits });

  const saveProfile = useMutation({
    mutationFn: () => {
      if (!profileForm) throw new Error("Perfil incompleto");
      return updateCustomer(customerId, {
        name: profileForm.name,
        email: profileForm.email,
        phone: profileForm.phone,
        defaultUnitId: profileForm.defaultUnitId || null,
      });
    },
    onSuccess: () => done("Cliente atualizado.", () => setProfileForm(null)),
    onError: (err) => setError(errorMessage(err)),
  });

  const activate = useMutation({
    mutationFn: () => activateCustomer(customerId),
    onSuccess: () => done("Cliente ativado."),
    onError: (err) => setError(errorMessage(err)),
  });

  const block = useMutation({
    mutationFn: () => blockCustomer(customerId),
    onSuccess: () => done("Cliente bloqueado.", () => setConfirmBlock(false)),
    onError: (err) => setError(errorMessage(err)),
  });

  const suspect = useMutation({
    mutationFn: () => markCustomerSuspect(customerId),
    onSuccess: () => done("Cliente marcado como suspeito."),
    onError: (err) => setError(errorMessage(err)),
  });

  function done(message: string, close?: () => void) {
    setNotice(message);
    setError("");
    close?.();
    void queryClient.invalidateQueries({ queryKey: ["customer", customerId] });
  }

  const data = customer.data;
  const unitOptions = (units.data ?? []).map((unit) => ({ label: unit.name, value: unit.id }));

  return (
    <ProtectedRoute roles={["SUPER_ADMIN"]}>
      <DashboardLayout title="Detalhe do Cliente">
        <div className="space-y-6">
          {customer.isLoading ? <LoadingState /> : null}
          {(customer.error || error) ? <ErrorState message={error || "Nao foi possivel carregar o cliente."} /> : null}
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
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Button type="button" onClick={() => setProfileForm(toProfileForm(data))}>Editar perfil</Button>
                    <Button type="button" variant="ghost" disabled={activate.isPending} onClick={() => activate.mutate()}>Ativar</Button>
                    <Button type="button" variant="ghost" disabled={suspect.isPending} onClick={() => suspect.mutate()}>Marcar suspeito</Button>
                    <Button type="button" disabled={block.isPending} onClick={() => setConfirmBlock(true)}>Bloquear</Button>
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

              {tab === "Rede/MMN" ? (
                <div className="grid gap-4 xl:grid-cols-2">
                  <JsonCard title="Resumo de indicacoes" data={referrals.data} />
                  <JsonCard title="Arvore" data={referralTree.data} />
                </div>
              ) : null}

              {tab === "Suporte" ? (
                <Card>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Info label="ID do cliente" value={customerId} />
                    <Info label="Email" value={data.email ?? "-"} />
                  </div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Button type="button" variant="ghost" onClick={() => void navigator.clipboard?.writeText(customerId)}>Copiar ID</Button>
                    <Button type="button" variant="ghost" onClick={() => suspect.mutate()}>Marcar suspeito</Button>
                    <Button type="button" onClick={() => setConfirmBlock(true)}>Bloquear</Button>
                  </div>
                  <div className="mt-5 rounded-lg border border-dashed border-gray-300 p-4 text-sm text-uau-gray">
                    Observacoes internas serao conectadas ao modulo de suporte quando o endpoint estiver disponivel.
                  </div>
                </Card>
              ) : null}
            </>
          ) : null}

          {profileForm ? (
            <FormModal title="Editar cliente" onClose={() => setProfileForm(null)} onSubmit={() => saveProfile.mutate()} busy={saveProfile.isPending}>
              <FormField label="Nome" value={profileForm.name} onChange={(event) => setProfileForm({ ...profileForm, name: event.target.value })} />
              <FormField label="Email" value={profileForm.email} onChange={(event) => setProfileForm({ ...profileForm, email: event.target.value })} />
              <FormField label="Telefone" value={profileForm.phone} onChange={(event) => setProfileForm({ ...profileForm, phone: event.target.value })} />
              <SelectField label="Unidade padrao" options={unitOptions} value={profileForm.defaultUnitId} onChange={(event) => setProfileForm({ ...profileForm, defaultUnitId: event.target.value })} />
            </FormModal>
          ) : null}

          {confirmBlock ? (
            <ConfirmDialog
              title="Bloquear cliente"
              message={`Confirma bloquear ${customerName(data)}?`}
              confirmLabel="Bloquear"
              onCancel={() => setConfirmBlock(false)}
              onConfirm={() => block.mutate()}
            />
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

function JsonCard({ title, data }: { title: string; data: unknown }) {
  return (
    <Card>
      <p className="mb-3 font-bold text-uau-black">{title}</p>
      {data ? <pre className="max-h-96 overflow-auto rounded-lg bg-gray-950 p-4 text-xs text-white">{JSON.stringify(data, null, 2)}</pre> : <p className="text-sm text-uau-gray">Endpoint opcional indisponivel ou sem dados.</p>}
    </Card>
  );
}

function toProfileForm(customer: Customer): ProfileForm {
  return {
    name: customer.name ?? customer.fullName ?? "",
    email: customer.email ?? "",
    phone: customer.phone ?? "",
    defaultUnitId: customer.defaultUnitId ?? customer.defaultUnit?.id ?? customer.unit?.id ?? "",
  };
}
