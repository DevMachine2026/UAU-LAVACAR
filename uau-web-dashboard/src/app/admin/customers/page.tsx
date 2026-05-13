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
  const customers = useQuery({ queryKey: ["customers", filters], queryFn: () => getCustomers(cleanParams(filters)) });
  const units = useQuery({ queryKey: ["units"], queryFn: getUnits });
  const unitOptions = (units.data ?? []).map((unit) => ({ label: unit.name, value: unit.id }));

  return (
    <ProtectedRoute roles={["SUPER_ADMIN"]}>
      <DashboardLayout title="Clientes">
        <div className="space-y-6">
          {(customers.isLoading || units.isLoading) ? <LoadingState /> : null}
          {(customers.error || units.error) ? <ErrorState /> : null}
          <Card>
            <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
              <FormField label="Nome" value={filters.name} onChange={(event) => setFilters({ ...filters, name: event.target.value })} />
              <FormField label="CPF" value={filters.cpf} onChange={(event) => setFilters({ ...filters, cpf: event.target.value })} />
              <FormField label="Telefone" value={filters.phone} onChange={(event) => setFilters({ ...filters, phone: event.target.value })} />
              <SelectField label="Status" options={["ACTIVE", "INACTIVE", "BLOCKED", "SUSPECT"].map(option)} value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })} />
              <SelectField label="Unidade" options={unitOptions} value={filters.unitId} onChange={(event) => setFilters({ ...filters, unitId: event.target.value })} />
              <SelectField label="Assinatura" options={["ACTIVE", "OVERDUE", "CANCELED", "NONE"].map(option)} value={filters.subscription} onChange={(event) => setFilters({ ...filters, subscription: event.target.value })} />
            </div>
            <div className="mt-4 flex justify-end">
              <Button type="button" variant="ghost" onClick={() => setFilters({ name: "", cpf: "", phone: "", status: "", unitId: "", subscription: "" })}>Limpar filtros</Button>
            </div>
          </Card>
          <CustomerTable customers={listItems(customers.data)} basePath="/admin/customers" />
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
