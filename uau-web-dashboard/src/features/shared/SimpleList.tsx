import { Card } from "@/components/Card";
import { formatDate } from "@/utils/format";
import { asRecord, getString } from "@/utils/data";

export function SimpleList({ items, empty }: { items: unknown[]; empty: string }) {
  if (items.length === 0) {
    return <Card>{empty}</Card>;
  }

  return (
    <div className="space-y-3">
      {items.slice(0, 10).map((item, index) => {
        const record = asRecord(item);
        return (
          <Card key={String(record.id ?? index)}>
            <p className="font-semibold text-uau-black">{getString(record, ["title", "name", "type", "status"], "Item")}</p>
            <p className="mt-1 text-sm text-uau-gray">{getString(record, ["message", "description", "email"], "")}</p>
            <p className="mt-2 text-xs text-uau-gray">{formatDate(getString(record, ["createdAt", "occurredAt", "lastPurchaseAt"]))}</p>
          </Card>
        );
      })}
    </div>
  );
}
