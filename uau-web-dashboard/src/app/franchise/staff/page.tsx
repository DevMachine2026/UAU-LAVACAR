"use client";

import { DashboardLayout } from "@/layout/DashboardLayout";
import { ProtectedRoute } from "@/layout/ProtectedRoute";
import { UnitStaffManager } from "@/features/staff/UnitStaffManager";

export default function FranchiseStaffPage() {
  return (
    <ProtectedRoute roles={["FRANCHISE_OWNER"]}>
      <DashboardLayout title="Equipe da Franquia">
        <UnitStaffManager />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
