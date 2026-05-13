import { Button } from "@/components/Button";
import { Card } from "@/components/Card";

export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirmar",
  onCancel,
  onConfirm,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4">
      <Card className="w-full max-w-md">
        <h2 className="text-lg font-bold text-uau-black">{title}</h2>
        <p className="mt-2 text-sm text-uau-gray">{message}</p>
        <div className="mt-5 flex justify-end gap-3">
          <Button onClick={onCancel} variant="ghost">Cancelar</Button>
          <Button onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </Card>
    </div>
  );
}
