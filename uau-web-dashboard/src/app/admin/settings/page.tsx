"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Toast } from "@/components/Toast";
import { ErrorState, LoadingState } from "@/components/State";
import { DashboardLayout } from "@/layout/DashboardLayout";
import { ProtectedRoute } from "@/layout/ProtectedRoute";
import { FormField } from "@/features/crud/FormField";
import { errorMessage } from "@/features/crud/feedback";
import {
  AdminSettings,
  getAdminSettings,
  updateAdminSettings,
} from "@/features/admin-settings/adminSettings.api";

type FieldDef = {
  key: string;
  label: string;
  prefix?: string;
  placeholder?: string;
};

type SectionDef = {
  title: string;
  fields: FieldDef[];
};

const SECTIONS: SectionDef[] = [
  {
    title: "Bônus de Cadastro",
    fields: [
      {
        key: "valor_bonus_cadastro_inicial",
        label: "Bônus inicial de cadastro",
        prefix: "R$",
        placeholder: "ex: 10.00",
      },
      {
        key: "bonus_cadastro_decaimento_diario",
        label: "Decaimento diário do bônus",
        prefix: "R$",
        placeholder: "ex: 0.50",
      },
      {
        key: "bonus_cadastro_validade_dias",
        label: "Validade do bônus (dias)",
        placeholder: "ex: 30",
      },
    ],
  },
  {
    title: "Cashback de Planos",
    fields: [
      {
        key: "plano_cashback_limite_percentual_plano",
        label: "Limite de cashback sobre o plano (%)",
        placeholder: "ex: 20",
      },
      {
        key: "plano_cashback_limite_percentual_saldo",
        label: "Limite de cashback sobre o saldo (%)",
        placeholder: "ex: 50",
      },
    ],
  },
  {
    title: "Rede MMN",
    fields: [
      {
        key: "mmn_bonus_ativacao_linha_1",
        label: "Bônus de ativação — linha 1",
        prefix: "R$",
        placeholder: "ex: 5.00",
      },
      {
        key: "mmn_bonus_ativacao_linha_2",
        label: "Bônus de ativação — linha 2",
        prefix: "R$",
        placeholder: "ex: 3.00",
      },
      {
        key: "mmn_bonus_ativacao_linha_3",
        label: "Bônus de ativação — linha 3",
        prefix: "R$",
        placeholder: "ex: 1.00",
      },
      {
        key: "mmn_bonus_recorrente_linha_1",
        label: "Bônus recorrente — linha 1",
        prefix: "R$",
        placeholder: "ex: 2.00",
      },
      {
        key: "mmn_bonus_recorrente_linha_2",
        label: "Bônus recorrente — linha 2",
        prefix: "R$",
        placeholder: "ex: 1.00",
      },
      {
        key: "mmn_bonus_recorrente_linha_3",
        label: "Bônus recorrente — linha 3",
        prefix: "R$",
        placeholder: "ex: 0.50",
      },
      {
        key: "mmn_dias_atraso_perde_bonus_mes",
        label: "Dias de atraso para perder bônus do mês",
        placeholder: "ex: 5",
      },
      {
        key: "mmn_dias_atraso_perde_rede",
        label: "Dias de atraso para perder a rede",
        placeholder: "ex: 30",
      },
    ],
  },
  {
    title: "Pagamento e Parceiros",
    fields: [
      {
        key: "permitir_alterar_forma_pagamento_ate_dias_antes",
        label: "Dias limite para alterar forma de pagamento",
        placeholder: "ex: 3",
      },
      {
        key: "parceiro_comissao_padrao_percentual",
        label: "Comissão padrão do parceiro (%)",
        placeholder: "ex: 10",
      },
      {
        key: "parceiro_cashback_cliente_padrao_percentual",
        label: "Cashback padrão ao cliente (%)",
        placeholder: "ex: 5",
      },
      {
        key: "parceiro_comissao_uau_padrao_percentual",
        label: "Comissão UAU padrão (%)",
        placeholder: "ex: 2",
      },
    ],
  },
];

export default function AdminSettingsPage() {
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const settings = useQuery({ queryKey: ["admin-settings"], queryFn: getAdminSettings });

  const formValues = useMemo(
    () =>
      settings.data
        ? Object.fromEntries(Object.entries(settings.data).map(([k, v]) => [k, String(v)]))
        : undefined,
    [settings.data],
  );
  const { watch, setValue, reset } = useForm<Record<string, string>>({ values: formValues });
  const form = watch();

  const save = useMutation({
    mutationFn: () => {
      const payload = Object.fromEntries(
        Object.entries(form).map(([key, value]) => [key, Number(value || 0)]),
      ) as AdminSettings;
      return updateAdminSettings(payload);
    },
    onSuccess: (data) => {
      setNotice("Configurações salvas.");
      setError("");
      reset(Object.fromEntries(Object.entries(data).map(([key, value]) => [key, String(value)])));
    },
    onError: (err) => setError(errorMessage(err)),
  });

  return (
    <ProtectedRoute roles={["SUPER_ADMIN"]}>
      <DashboardLayout title="Configurações">
        <div className="space-y-6">
          {settings.isLoading ? <LoadingState /> : null}
          {settings.error || error ? (
            <ErrorState message={error || "Não foi possível carregar as configurações."} />
          ) : null}
          <Toast message={notice} onDismiss={() => setNotice("")} />
          {SECTIONS.map((section) => (
            <Card key={section.title}>
              <h2 className="mb-4 text-base font-bold text-uau-black">{section.title}</h2>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {section.fields.map(({ key, label, prefix, placeholder }) => (
                  <FormField
                    key={key}
                    label={label}
                    min="0"
                    placeholder={placeholder}
                    prefix={prefix}
                    step="0.01"
                    type="number"
                    value={form[key] ?? ""}
                    onChange={(event) => setValue(key, event.target.value)}
                  />
                ))}
              </div>
            </Card>
          ))}
          <div className="flex justify-end">
            <Button disabled={save.isPending || settings.isLoading} onClick={() => save.mutate()}>
              Salvar configurações
            </Button>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
