import Link from "next/link";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { EmptyState } from "@/components/State";
import { Customer, BillingHistoryItem, Vehicle, WalletStatementItem, WashHistoryItem, Wallet } from "./customers.api";

export function CustomerStatusBadge({ status }: { status?: string }) {
  const normalized = status ?? "UNKNOWN";
  const className =
    normalized === "ACTIVE"
      ? "bg-[#0BA95B]/10 text-[#0BA95B]"
      : normalized === "BLOCKED" || normalized === "SUSPECT"
        ? "bg-[#D92D20]/10 text-[#D92D20]"
        : "bg-[#F59E0B]/10 text-[#F59E0B]";
  return <span className={`rounded-lg px-3 py-2 text-xs font-bold ${className}`}>{normalized}</span>;
}

export function CustomerTable({ customers, basePath }: { customers: Customer[]; basePath: string }) {
  if (!customers.length) return <EmptyState title="Nenhum cliente" description="Ajuste os filtros ou aguarde novos cadastros." />;
  return (
    <Card className="overflow-x-auto p-0">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            {["Nome", "CPF", "Telefone", "Unidade", "Status", "Assinatura", "Wallet", "Acoes"].map((header) => (
              <th className="px-4 py-3 font-bold text-uau-gray" key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <tr className="border-b border-gray-100 last:border-0" key={customer.id}>
              <td className="px-4 py-3 font-bold text-uau-black">{customerName(customer)}</td>
              <td className="px-4 py-3">{maskCpf(customer.cpf ?? customer.document)}</td>
              <td className="px-4 py-3">{maskPhone(customer.phone)}</td>
              <td className="px-4 py-3">{customer.defaultUnit?.name ?? customer.unit?.name ?? customer.defaultUnitId ?? "-"}</td>
              <td className="px-4 py-3"><CustomerStatusBadge status={customer.user?.status ?? customer.status} /></td>
              <td className="px-4 py-3">{customer.subscriptions?.[0]?.status ?? customer.subscription?.status ?? customer.subscriptionStatus ?? "-"}</td>
              <td className="px-4 py-3">{money(customer.wallet?.totalBalance ?? customer.wallet?.availableBalance ?? Number(customer.wallet?.balance ?? 0))}</td>
              <td className="px-4 py-3"><Link href={`${basePath}/${customer.id}`}><Button type="button" variant="ghost">Detalhe</Button></Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

export function CustomerDetailTabs({ tabs, active, onChange }: { tabs: string[]; active: string; onChange: (tab: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <Button key={tab} type="button" variant={active === tab ? "primary" : "ghost"} onClick={() => onChange(tab)}>
          {tab}
        </Button>
      ))}
    </div>
  );
}

export function VehicleList({ vehicles }: { vehicles: Vehicle[] }) {
  if (!vehicles.length) return <EmptyState title="Sem veiculos" description="Nenhum veiculo encontrado para este cliente." />;
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {vehicles.map((vehicle) => (
        <Card key={vehicle.id}>
          <p className="text-xl font-bold text-uau-black">{vehicle.plate ?? "-"}</p>
          <p className="mt-1 text-sm text-uau-gray">{[vehicle.brand, vehicle.model, vehicle.year].filter(Boolean).join(" ") || "Modelo nao informado"}</p>
          <p className="mt-2 text-sm font-semibold text-uau-black">{vehicle.isActive === false ? "Inativo" : "Ativo"}</p>
        </Card>
      ))}
    </div>
  );
}

export function BillingHistoryTable({ items }: { items: BillingHistoryItem[] }) {
  return <SimpleTable rows={items} headers={["Vencimento", "Status", "Valor base", "Cashback", "Gateway", "Asaas"]} render={(item) => [
    formatDate(item.dueDate ?? item.createdAt),
    item.status ?? "-",
    money(item.baseAmount ?? item.amount),
    money(item.cashbackUsed),
    money(item.gatewayAmount),
    item.asaasStatus ?? "-",
  ]} />;
}

export function WalletStatementTable({ wallet, items }: { wallet?: Wallet; items: WalletStatementItem[] }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        <Balance label="Disponivel" value={wallet?.availableBalance} />
        <Balance label="Promocional" value={wallet?.promotionalBalance} />
        <Balance label="Bloqueado" value={wallet?.blockedBalance} />
        <Balance label="Total" value={wallet?.totalBalance} />
      </div>
      <SimpleTable rows={items} headers={["Data", "Tipo", "Origem", "Valor", "Saldo", "Descricao"]} render={(item) => [
        formatDate(item.createdAt),
        item.type ?? "-",
        item.source ?? "-",
        money(item.amount),
        money(item.balanceAfter),
        item.description ?? "-",
      ]} />
    </div>
  );
}

export function WashHistoryTable({ items }: { items: WashHistoryItem[] }) {
  return <SimpleTable rows={items} headers={["Data", "Placa", "Unidade", "Tipo", "Origem", "Status"]} render={(item) => [
    formatDate(item.usedAt ?? item.createdAt),
    item.plate ?? "-",
    item.unit?.name ?? item.unitId ?? "-",
    item.type ?? "-",
    item.source ?? "-",
    item.status ?? "-",
  ]} />;
}

function SimpleTable<T extends { id: string }>({ rows, headers, render }: { rows: T[]; headers: string[]; render: (row: T) => React.ReactNode[] }) {
  if (!rows.length) return <EmptyState title="Nenhum registro" description="Sem dados para exibir nesta aba." />;
  return (
    <Card className="overflow-x-auto p-0">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            {headers.map((header) => <th className="px-4 py-3 font-bold text-uau-gray" key={header}>{header}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr className="border-b border-gray-100 last:border-0" key={row.id}>
              {render(row).map((cell, index) => <td className="px-4 py-3 text-uau-black" key={`${row.id}-${index}`}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function Balance({ label, value }: { label: string; value?: number }) {
  return (
    <Card>
      <p className="text-sm text-uau-gray">{label}</p>
      <p className="mt-2 text-xl font-bold text-uau-black">{money(value)}</p>
    </Card>
  );
}

export function customerName(customer?: Customer | null) {
  return customer?.user?.name ?? customer?.name ?? customer?.fullName ?? customer?.user?.email ?? customer?.email ?? customer?.id ?? "-";
}

export function maskCpf(value?: string) {
  const digits = (value ?? "").replace(/\D/g, "");
  if (digits.length < 11) return value ? "***" : "-";
  return `${digits.slice(0, 3)}.***.***-${digits.slice(9, 11)}`;
}

export function maskPhone(value?: string) {
  const digits = (value ?? "").replace(/\D/g, "");
  if (digits.length < 10) return value ?? "-";
  return `(**) *****-${digits.slice(-4)}`;
}

export function money(value?: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value ?? 0);
}

export function formatDate(value?: string | null) {
  return value ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "-";
}
