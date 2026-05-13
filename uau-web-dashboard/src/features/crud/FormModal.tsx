import { Button } from "@/components/Button";
import { Card } from "@/components/Card";

export function FormModal({
  title,
  children,
  onClose,
  onSubmit,
  submitLabel = "Salvar",
  busy,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  onSubmit: () => void;
  submitLabel?: string;
  busy?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/30 p-4">
      <Card className="max-h-[90vh] w-full max-w-3xl overflow-auto">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-uau-black">{title}</h2>
          <Button onClick={onClose} type="button" variant="ghost">Fechar</Button>
        </div>
        <div className="mt-5 grid gap-4">{children}</div>
        <div className="mt-6 flex justify-end">
          <Button disabled={busy} onClick={onSubmit} type="button">{submitLabel}</Button>
        </div>
      </Card>
    </div>
  );
}
