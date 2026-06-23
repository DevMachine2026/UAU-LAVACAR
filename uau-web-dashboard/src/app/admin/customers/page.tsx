"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { ErrorState, LoadingState } from "@/components/State";
import { FormField } from "@/features/crud/FormField";
import { SelectField } from "@/features/crud/SelectField";
import { CustomerTable } from "@/features/customers/components";
import { getCustomers, listItems } from "@/features/customers/customers.api";
import { getUnits } from "@/features/locations/locations.api";
import { DashboardLayout } from "@/layout/DashboardLayout";
import { ProtectedRoute } from "@/layout/ProtectedRoute";

export default function AdminCustomersPage() {
  const [filters, setFilters] = useState({ name: "", cpf: "", phone: "", status: "", unitId: "", subscription: "" });
  const [page, setPage] = useState(1);
  const customers = useQuery({ queryKey: ["customers", filters, page], queryFn: () => getCustomers({ ...cleanParams(filters), page, limit: 20 }) });
  const units = useQuery({ queryKey: ["units"], queryFn: getUnits });
  const unitOptions = (units.data ?? []).map((unit) => ({ label: unit.name, value: unit.id }));
  const customerItems = listItems(customers.data);

  function updateFilters(next: typeof filters) {
    setFilters(next);
    setPage(1);
  }

  return (
    <ProtectedRoute roles={["SUPER_ADMIN"]}>
      <DashboardLayout title="Clientes">
        <div className="space-y-6">
          {(customers.isLoading || units.isLoading) ? <LoadingState /> : null}
          {(customers.error || units.error) ? <ErrorState /> : null}
          <Card>
            <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
              <FormField label="Nome" value={filters.name} onChange={(event) => updateFilters({ ...filters, name: event.target.value })} />
              <FormField label="CPF" value={filters.cpf} onChange={(event) => updateFilters({ ...filters, cpf: event.target.value })} />
              <FormField label="Telefone" value={filters.phone} onChange={(event) => updateFilters({ ...filters, phone: event.target.value })} />
              <SelectField label="Status" options={["ACTIVE", "INACTIVE", "BLOCKED", "SUSPECT"].map(option)} value={filters.status} onChange={(event) => updateFilters({ ...filters, status: event.target.value })} />
              <SelectField label="Unidade" options={unitOptions} value={filters.unitId} onChange={(event) => updateFilters({ ...filters, unitId: event.target.value })} />
              <SelectField label="Assinatura" options={["ACTIVE", "OVERDUE", "CANCELED", "NONE"].map(option)} value={filters.subscription} onChange={(event) => updateFilters({ ...filters, subscription: event.target.value })} />
            </div>
            <div className="mt-4 flex justify-end">
              <Button type="button" variant="ghost" onClick={() => updateFilters({ name: "", cpf: "", phone: "", status: "", unitId: "", subscription: "" })}>Limpar filtros</Button>
            </div>
          </Card>
          <CustomerTable customers={customerItems} basePath="/admin/customers" />
          <div className="flex items-center justify-center gap-4">
            <Button disabled={page === 1} type="button" variant="ghost" onClick={() => setPage(page - 1)}>Anterior</Button>
            <span className="text-sm text-uau-gray">Página {page}</span>
            <Button disabled={customerItems.length < 20} type="button" variant="ghost" onClick={() => setPage(page + 1)}>Próximo</Button>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function option(value: string) {
  return { label: value, value };
}

function cleanParams<T extends Record<string, string>>(params: T) {
  return Object.fromEntries(Object.entries(params).filter(([, value]) => value !== "")) as T;
}
