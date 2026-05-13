"use client";

import { DashboardLayout } from "@/layout/DashboardLayout";
import { ProtectedRoute } from "@/layout/ProtectedRoute";
import { UnitStaffManager } from "@/features/staff/UnitStaffManager";

export default function AdminUnitStaffPage() {
  return (
    <ProtectedRoute roles={["SUPER_ADMIN"]}>
      <DashboardLayout title="Equipe das Unidades">
        <UnitStaffManager />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
