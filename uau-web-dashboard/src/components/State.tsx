import { Card } from "@/components/Card";

export function LoadingState() {
  return <Card>Carregando dados...</Card>;
}

export function ErrorState({ message = "Nao foi possivel carregar os dados agora." }: { message?: string }) {
  return <Card className="border-red-200 text-red-700">{message}</Card>;
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <Card>
      <p className="font-semibold text-uau-black">{title}</p>
      <p className="mt-1 text-sm text-uau-gray">{description}</p>
    </Card>
  );
}
