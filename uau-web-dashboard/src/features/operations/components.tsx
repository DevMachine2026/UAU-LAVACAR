import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { MetricCard } from "@/components/MetricCard";
import { MetricGrid } from "@/features/shared/MetricGrid";
import { AnprEvent } from "@/features/anpr/anpr.api";
import { Attendance, Closure, LiveSummary, PlateCheck, ReadingField, Shift } from "./operations.api";

export function OperationMetricCard({ label, value, money }: { label: string; value: number | string; money?: boolean }) {
  return <MetricCard label={label} value={value} money={money} />;
}

export function ShiftCard({ shift, onSelect }: { shift: Shift; onSelect?: (shift: Shift) => void }) {
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-uau-gray">{shift.unit?.name ?? shift.unitId ?? "Unidade"}</p>
          <p className="mt-1 text-lg font-bold text-uau-black">{shift.status ?? "OPEN"}</p>
          <p className="text-sm text-uau-gray">{formatDate(shift.openedAt)} {shift.closedAt ? `- ${formatDate(shift.closedAt)}` : ""}</p>
        </div>
        {onSelect ? <Button type="button" variant="ghost" onClick={() => onSelect(shift)}>Detalhe</Button> : null}
      </div>
    </Card>
  );
}

export function LiveSummaryPanel({
  summary,
  onComplete,
  onCancel,
}: {
  summary?: LiveSummary;
  onComplete?: (attendance: Attendance) => void;
  onCancel?: (attendance: Attendance) => void;
}) {
  const totalByType = summary?.totalByType ?? {};
  return (
    <div className="space-y-4">
      <MetricGrid>
        <OperationMetricCard label="Atendimentos" value={summary?.totalAttendances ?? 0} />
        <OperationMetricCard label="Plano" value={totalByType.PLAN ?? 0} />
        <OperationMetricCard label="Avulso" value={totalByType.AVULSO ?? 0} />
        <OperationMetricCard label="Bloqueado" value={totalByType.BLOCKED ?? 0} />
        <OperationMetricCard label="Bruto" value={summary?.grossAmount ?? 0} money />
        <OperationMetricCard label="Liquido" value={summary?.netAmount ?? 0} money />
      </MetricGrid>
      {summary?.attendances?.length ? (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {["Placa", "Tipo", "Origem", "Status", "Valor", "Acoes"].map((header) => (
                  <th className="px-4 py-3 font-bold text-uau-gray" key={header}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {summary.attendances.map((attendance) => (
                <tr className="border-b border-gray-100 last:border-0" key={attendance.id}>
                  <td className="px-4 py-3 font-bold text-uau-black">{attendance.plate ?? "-"}</td>
                  <td className="px-4 py-3">{attendance.type ?? "-"}</td>
                  <td className="px-4 py-3">{attendance.source ?? "-"}</td>
                  <td className="px-4 py-3">{attendance.status ?? "-"}</td>
                  <td className="px-4 py-3">{money(attendance.amountPaid)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {onComplete ? <Button type="button" variant="ghost" onClick={() => onComplete(attendance)}>Concluir</Button> : null}
                      {onCancel ? <Button type="button" variant="ghost" onClick={() => onCancel(attendance)}>Cancelar</Button> : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : null}
    </div>
  );
}

export function PlateCheckResult({ result, onConfirm, busy }: { result: PlateCheck; onConfirm?: () => void; busy?: boolean }) {
  const history = result.quickHistory ?? result.history ?? [];
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-uau-gray">Placa</p>
          <p className="text-3xl font-bold text-uau-black">{result.normalizedPlate}</p>
        </div>
        <span className={`rounded-lg px-4 py-3 text-sm font-bold ${statusClass(result.status)}`}>{result.status}</span>
      </div>
      <p className="mt-4 text-base font-semibold text-uau-black">{result.reason ?? statusMessage(result.status)}</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Info label="Cliente" value={result.customer?.name ?? "Nao encontrado"} detail={result.customer?.email} />
        <Info label="Veiculo" value={vehicleLabel(result.vehicle)} detail={result.vehicle?.color} />
        <Info label="Plano" value={result.plan?.name ?? "Sem plano"} detail={result.plan?.coverageType} />
        <Info label="Assinatura" value={result.subscription?.status ?? "Sem assinatura"} detail={formatDate(result.subscription?.nextDueDate)} />
        <Info label="Unidade" value={result.unit?.name ?? result.allowedUnit?.name ?? "-"} />
        <Info label="Ultima lavagem" value={formatDate(result.lastWash?.usedAt) || "Sem registro"} detail={result.lastWash?.unit?.name} />
        <Info label="Proxima liberacao" value={result.nextReleaseLocal ?? result.nextRelease ?? "-"} />
      </div>
      {result.status === "ALREADY_USED_TODAY" ? <p className="mt-5 rounded-lg bg-amber-50 p-3 text-sm font-semibold text-amber-800">Esta placa ja teve baixa hoje. Nova lavagem apenas na proxima liberacao.</p> : null}
      {history.length ? (
        <div className="mt-6">
          <p className="mb-2 font-bold text-uau-black">Historico rapido</p>
          <div className="grid gap-2">
            {history.map((item) => <p className="rounded-lg border border-gray-200 p-3 text-sm" key={item.id}>{formatDate(item.usedAt)} - {item.status ?? "CONFIRMED"} - {item.unit?.name ?? "-"}</p>)}
          </div>
        </div>
      ) : null}
      {onConfirm ? <div className="mt-6"><Button disabled={!result.canWashToday || busy} onClick={onConfirm}>Dar baixa na lavagem</Button></div> : null}
    </Card>
  );
}

export function AnprEventCard({ event }: { event: AnprEvent }) {
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xl font-bold text-uau-black">{event.normalizedPlate ?? event.plate ?? "-"}</p>
          <p className="text-sm text-uau-gray">{formatDate(event.capturedAt ?? event.createdAt)}</p>
          {event.reason ? <p className="mt-1 text-sm text-uau-gray">{event.reason}</p> : null}
        </div>
        <span className={`rounded-lg px-3 py-2 text-sm font-bold ${statusClass(event.status)}`}>{event.status ?? "UNKNOWN"}</span>
      </div>
    </Card>
  );
}

export function ClosureCard({ closure }: { closure: Closure }) {
  return (
    <Card>
      <p className="font-bold text-uau-black">{closure.unit?.name ?? closure.unitId ?? "Unidade"}</p>
      <p className="text-sm text-uau-gray">{formatDate(closure.closedAt ?? closure.createdAt)}</p>
      <div className="mt-3 grid gap-2 text-sm">
        <span>Bruto: {money(closure.grossAmount)}</span>
        <span>Liquido: {money(closure.netAmount)}</span>
        <span>Divergencia: {money(closure.divergenceAmount)}</span>
        <span>Status: {closure.status ?? "-"}</span>
      </div>
    </Card>
  );
}

export function ReadingFieldsForm({ fields, values, onChange }: { fields: ReadingField[]; values: Record<string, string>; onChange: (values: Record<string, string>) => void }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {fields.filter((field) => field.isActive !== false).map((field) => (
        <label className="grid gap-1 text-sm font-semibold text-uau-black" key={field.id}>
          <span>{field.name}</span>
          <input
            className="h-11 rounded-lg border border-gray-300 px-3 text-sm font-normal outline-none focus:border-uau-green"
            min="0"
            onChange={(event) => onChange({ ...values, [field.id]: event.target.value })}
            type="number"
            value={values[field.id] ?? ""}
          />
        </label>
      ))}
    </div>
  );
}

function Info({ label, value, detail }: { label: string; value: string; detail?: string | null }) {
  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <p className="text-xs font-semibold uppercase text-uau-gray">{label}</p>
      <p className="mt-1 font-bold text-uau-black">{value}</p>
      {detail ? <p className="mt-1 text-sm text-uau-gray">{detail}</p> : null}
    </div>
  );
}

function statusClass(status?: string) {
  if (status === "AUTHORIZED" || status === "OPEN" || status === "COMPLETED") return "bg-emerald-100 text-emerald-800";
  if (status === "ALREADY_USED_TODAY" || status === "AVULSO" || status === "UNKNOWN") return "bg-amber-100 text-amber-800";
  return "bg-red-100 text-red-800";
}

function statusMessage(status?: string) {
  const messages: Record<string, string> = {
    AUTHORIZED: "Lavagem autorizada para hoje.",
    ALREADY_USED_TODAY: "Este veiculo ja teve uma lavagem baixada hoje.",
    NO_ACTIVE_SUBSCRIPTION: "Nao existe assinatura ativa para esta placa.",
    OVERDUE: "Assinatura em atraso.",
    BLOCKED: "Cliente, assinatura ou plano bloqueado.",
    OUT_OF_UNIT: "Plano fora desta unidade.",
    OUT_OF_CITY: "Plano fora desta cidade.",
    OUT_OF_STATE: "Plano fora deste estado.",
    OUT_OF_TIME: "Fora do dia ou horario permitido pelo plano.",
    VEHICLE_NOT_FOUND: "Placa nao cadastrada ou veiculo inativo.",
  };
  return messages[status ?? ""] ?? status ?? "-";
}

function vehicleLabel(vehicle: PlateCheck["vehicle"]) {
  if (!vehicle) return "Nao encontrado";
  return [vehicle.brand, vehicle.model, vehicle.plate].filter(Boolean).join(" ");
}

function money(value?: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value ?? 0);
}

function formatDate(value?: string) {
  return value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "-";
}
