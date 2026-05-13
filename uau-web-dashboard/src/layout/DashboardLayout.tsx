"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/Button";
import { useAuthStore } from "@/auth/auth.store";

type NavItem = {
  href: string;
  label: string;
};

const NAV_BY_ROLE: Record<string, NavItem[]> = {
  SUPER_ADMIN: [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/settings", label: "Settings" },
    { href: "/admin/plans", label: "Plans" },
    { href: "/admin/vehicle-sizes", label: "Portes" },
    { href: "/admin/locations", label: "Locations" },
    { href: "/admin/partners", label: "Partners" },
    { href: "/admin/customers", label: "Clientes" },
    { href: "/admin/units/staff", label: "Equipe" },
    { href: "/admin/campaigns", label: "Campaigns" },
    { href: "/admin/financial", label: "Financial" },
    { href: "/admin/antifraud", label: "Antifraud" },
    { href: "/admin/operations", label: "Operacoes" },
    { href: "/operator/anpr", label: "ANPR" },
    { href: "/operator/shifts", label: "Expedientes" },
    { href: "/operator/plate-check", label: "Placas" }
  ],
  FRANCHISE_OWNER: [
    { href: "/franchise", label: "Minha Franquia" },
    { href: "/franchise/customers", label: "Clientes" },
    { href: "/franchise/staff", label: "Equipe" },
    { href: "/franchise/operations", label: "Operacoes" },
    { href: "/operator", label: "Operador" },
    { href: "/operator/anpr", label: "ANPR" },
    { href: "/operator/shifts", label: "Expedientes" },
    { href: "/operator/plate-check", label: "Placas" }
  ],
  PARTNER: [{ href: "/partner", label: "Meu Parceiro" }],
  OPERATOR: [
    { href: "/operator", label: "Operacao" },
    { href: "/operator/shifts", label: "Expedientes" },
    { href: "/operator/anpr", label: "ANPR" },
    { href: "/operator/plate-check", label: "Placas" }
  ]
};

export function DashboardLayout({ children, title }: { children: React.ReactNode; title: string }) {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const nav = NAV_BY_ROLE[user?.role ?? ""] ?? [];

  return (
    <div className="min-h-screen bg-uau-light">
      <aside className="fixed left-0 top-0 hidden h-screen w-64 border-r border-gray-200 bg-white p-5 lg:block">
        <div className="text-2xl font-bold text-uau-black">UAU+</div>
        <div className="mt-8 space-y-2">
          {nav.map((item) => (
            <Link
              className={`block rounded-lg px-4 py-3 text-sm font-semibold ${
                pathname === item.href ? "bg-uau-green text-white" : "text-uau-gray hover:bg-uau-light"
              }`}
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </aside>
      <main className="lg:pl-64">
        <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 px-5 py-4 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-uau-black">{title}</h1>
              <p className="text-sm text-uau-gray">{user?.name} · {user?.role}</p>
            </div>
            <Button onClick={logout} variant="ghost">Sair</Button>
          </div>
        </header>
        <div className="p-5">{children}</div>
      </main>
    </div>
  );
}
