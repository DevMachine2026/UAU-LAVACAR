import { Card } from "@/components/Card";
import { DashboardLayout } from "@/layout/DashboardLayout";
import { ProtectedRoute } from "@/layout/ProtectedRoute";

export function AdminPlaceholder({ title, description }: { title: string; description: string }) {
  return (
    <ProtectedRoute roles={["SUPER_ADMIN"]}>
      <DashboardLayout title={title}>
        <Card>
          <h2 className="text-xl font-bold text-uau-black">{title}</h2>
          <p className="mt-2 text-uau-gray">{description}</p>
          <p className="mt-4 text-sm text-uau-gray">Placeholder profissional pronto para conectar aos endpoints detalhados.</p>
        </Card>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
