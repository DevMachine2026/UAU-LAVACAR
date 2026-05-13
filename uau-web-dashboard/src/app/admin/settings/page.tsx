"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { ErrorState, LoadingState } from "@/components/State";
import { DashboardLayout } from "@/layout/DashboardLayout";
import { ProtectedRoute } from "@/layout/ProtectedRoute";
import { FormField } from "@/features/crud/FormField";
import { errorMessage } from "@/features/crud/feedback";
import { AdminSettings, getAdminSettings, updateAdminSettings } from "@/features/admin-settings/adminSettings.api";

const LABELS: Record<string, string> = {
  valor_bonus_cadastro_inicial: "Bonus inicial de cadastro",
  bonus_cadastro_decaimento_diario: "Decaimento diario do bonus",
  bonus_cadastro_validade_dias: "Validade do bonus em dias",
  plano_cashback_limite_percentual_plano: "Limite cashback sobre plano (%)",
  plano_cashback_limite_percentual_saldo: "Limite cashback sobre saldo (%)",
  mmn_bonus_ativacao_linha_1: "MMN ativacao linha 1",
  mmn_bonus_ativacao_linha_2: "MMN ativacao linha 2",
  mmn_bonus_ativacao_linha_3: "MMN ativacao linha 3",
  mmn_bonus_recorrente_linha_1: "MMN recorrente linha 1",
  mmn_bonus_recorrente_linha_2: "MMN recorrente linha 2",
  mmn_bonus_recorrente_linha_3: "MMN recorrente linha 3",
  mmn_dias_atraso_perde_bonus_mes: "Dias atraso perde bonus mes",
  mmn_dias_atraso_perde_rede: "Dias atraso perde rede",
  permitir_alterar_forma_pagamento_ate_dias_antes: "Dias limite para alterar pagamento",
  parceiro_comissao_padrao_percentual: "Comissao padrao parceiro (%)",
  parceiro_cashback_cliente_padrao_percentual: "Cashback cliente padrao (%)",
  parceiro_comissao_uau_padrao_percentual: "Comissao UAU padrao (%)",
};

export default function AdminSettingsPage() {
  const [form, setForm] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const settings = useQuery({ queryKey: ["admin-settings"], queryFn: getAdminSettings });

  useEffect(() => {
    if (!settings.data) return;
    setForm(Object.fromEntries(Object.entries(settings.data).map(([key, value]) => [key, String(value)])));
  }, [settings.data]);

  const save = useMutation({
    mutationFn: () => {
      const payload = Object.fromEntries(
        Object.entries(form).map(([key, value]) => [key, Number(value || 0)]),
      ) as AdminSettings;
      return updateAdminSettings(payload);
    },
    onSuccess: (data) => {
      setNotice("Configuracoes salvas.");
      setError("");
      setForm(Object.fromEntries(Object.entries(data).map(([key, value]) => [key, String(value)])));
    },
    onError: (err) => setError(errorMessage(err)),
  });

  return (
    <ProtectedRoute roles={["SUPER_ADMIN"]}>
      <DashboardLayout title="Settings">
        <div className="space-y-6">
          {settings.isLoading ? <LoadingState /> : null}
          {(settings.error || error) ? <ErrorState message={error || "Nao foi possivel carregar configuracoes."} /> : null}
          {notice ? <Card className="border-emerald-200 text-emerald-800">{notice}</Card> : null}
          <Card>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Object.keys(form).map((key) => (
                <FormField
                  key={key}
                  label={LABELS[key] ?? key}
                  min="0"
                  step="0.01"
                  type="number"
                  value={form[key]}
                  onChange={(event) => setForm({ ...form, [key]: event.target.value })}
                />
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <Button disabled={save.isPending || settings.isLoading} onClick={() => save.mutate()}>Salvar configuracoes</Button>
            </div>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
