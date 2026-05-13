"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@/api/client";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { ErrorState, LoadingState } from "@/components/State";
import { Section } from "@/components/Section";
import { getEndpoint, postEndpoint } from "@/features/shared/dashboard.api";

type Unit = { id: string; name: string; city?: { name: string } };
type Staff = {
  id: string;
  role: "MANAGER" | "OPERATOR";
  isActive: boolean;
  user: { id: string; name: string; email: string; role: string; status?: string };
  unit?: { id: string; name: string };
};

export function UnitStaffManager() {
  const queryClient = useQueryClient();
  const [unitId, setUnitId] = useState("");
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<"MANAGER" | "OPERATOR">("OPERATOR");

  const units = useQuery({
    queryKey: ["units"],
    queryFn: () => getEndpoint<Unit[]>("/franchise-units")
  });

  const staff = useQuery({
    queryKey: ["unit-staff", unitId],
    queryFn: () => getEndpoint<Staff[]>(`/franchise-units/${unitId}/staff`),
    enabled: Boolean(unitId)
  });

  const addStaff = useMutation({
    mutationFn: () => postEndpoint(`/franchise-units/${unitId}/staff`, { userId, role }),
    onSuccess: () => {
      setUserId("");
      queryClient.invalidateQueries({ queryKey: ["unit-staff", unitId] });
    }
  });

  const toggleStaff = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      api.patch(`/franchise-units/${unitId}/staff/${id}/${active ? "activate" : "deactivate"}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["unit-staff", unitId] })
  });

  return (
    <div className="space-y-6">
      {(units.isLoading || staff.isLoading) ? <LoadingState /> : null}
      {(units.error || staff.error || addStaff.error || toggleStaff.error) ? <ErrorState /> : null}

      <Section title="Unidade">
        <Card>
          <select
            className="h-11 w-full rounded-lg border border-gray-300 px-3"
            onChange={(event) => setUnitId(event.target.value)}
            value={unitId}
          >
            <option value="">Selecione uma unidade</option>
            {(units.data ?? []).map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.name}{unit.city?.name ? ` - ${unit.city.name}` : ""}
              </option>
            ))}
          </select>
        </Card>
      </Section>

      {unitId ? (
        <>
          <Section title="Cadastrar funcionario">
            <Card>
              <div className="grid gap-4 md:grid-cols-[1fr_180px_auto]">
                <input
                  className="h-11 rounded-lg border border-gray-300 px-3"
                  onChange={(event) => setUserId(event.target.value)}
                  placeholder="ID do usuario"
                  value={userId}
                />
                <select
                  className="h-11 rounded-lg border border-gray-300 px-3"
                  onChange={(event) => setRole(event.target.value as "MANAGER" | "OPERATOR")}
                  value={role}
                >
                  <option value="OPERATOR">Operador</option>
                  <option value="MANAGER">Gerente</option>
                </select>
                <Button disabled={!userId || addStaff.isPending} onClick={() => addStaff.mutate()}>
                  Vincular
                </Button>
              </div>
            </Card>
          </Section>

          <Section title="Equipe">
            <div className="grid gap-4">
              {(staff.data ?? []).map((item) => (
                <Card key={item.id}>
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="font-bold text-uau-black">{item.user.name}</p>
                      <p className="text-sm text-uau-gray">{item.user.email}</p>
                      <p className="mt-1 text-sm text-uau-gray">{item.role} · {item.user.status ?? item.user.role}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`rounded-lg px-3 py-2 text-sm font-bold ${item.isActive ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-uau-gray"}`}>
                        {item.isActive ? "Ativo" : "Inativo"}
                      </span>
                      <Button
                        disabled={toggleStaff.isPending}
                        onClick={() => toggleStaff.mutate({ id: item.id, active: !item.isActive })}
                        variant="ghost"
                      >
                        {item.isActive ? "Desativar" : "Ativar"}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
              {staff.data?.length === 0 ? <Card><p className="text-sm text-uau-gray">Nenhum funcionario vinculado.</p></Card> : null}
            </div>
          </Section>
        </>
      ) : null}
    </div>
  );
}
