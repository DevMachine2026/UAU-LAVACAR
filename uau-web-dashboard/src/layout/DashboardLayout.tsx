"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/Button";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useAuthStore } from "@/auth/auth.store";

type NavItem = { href: string; label: string };

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
    { href: "/operator/plate-check", label: "Placas" },
  ],
  FRANCHISE_OWNER: [
    { href: "/franchise", label: "Minha Franquia" },
    { href: "/franchise/customers", label: "Clientes" },
    { href: "/franchise/staff", label: "Equipe" },
    { href: "/franchise/operations", label: "Operacoes" },
    { href: "/operator", label: "Operador" },
    { href: "/operator/anpr", label: "ANPR" },
    { href: "/operator/shifts", label: "Expedientes" },
    { href: "/operator/plate-check", label: "Placas" },
  ],
  PARTNER: [{ href: "/partner", label: "Meu Parceiro" }],
  OPERATOR: [
    { href: "/operator", label: "Operacao" },
    { href: "/operator/shifts", label: "Expedientes" },
    { href: "/operator/anpr", label: "ANPR" },
    { href: "/operator/plate-check", label: "Placas" },
  ],
};

function NavLinks({
  nav,
  pathname,
  onNavigate,
}: {
  nav: NavItem[];
  pathname: string;
  onNavigate: () => void;
}) {
  return (
    <nav className="space-y-1">
      {nav.map((item) => (
        <Link
          className={`block rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
            pathname === item.href
              ? "bg-uau-primaryDark text-white"
              : "text-white/80 hover:bg-white/10 hover:text-white"
          }`}
          href={item.href}
          key={item.href}
          onClick={onNavigate}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export function DashboardLayout({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const nav = NAV_BY_ROLE[user?.role ?? ""] ?? [];
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-uau-light">
      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 hidden h-screen w-64 overflow-y-auto bg-uau-primary p-5 lg:block">
        <div className="mb-8">
          <Image
            src="/logo.png"
            alt="UAU+"
            width={160}
            height={48}
            className="h-12 w-auto object-contain"
          />
        </div>
        <NavLinks nav={nav} pathname={pathname} onNavigate={() => {}} />
      </aside>

      {/* Mobile drawer backdrop */}
      {drawerOpen && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Mobile sidebar drawer */}
      <aside
        className={`fixed left-0 top-0 z-40 h-screen w-72 overflow-y-auto bg-uau-primary p-5 transition-transform duration-300 ease-in-out lg:hidden ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-8 flex items-center justify-between">
          <Image
            src="/logo.png"
            alt="UAU+"
            width={120}
            height={36}
            className="h-9 w-auto object-contain"
          />
          <button
            aria-label="Fechar menu"
            className="rounded-lg p-1 text-white/80 hover:bg-white/10 hover:text-white"
            onClick={() => setDrawerOpen(false)}
          >
            <X size={20} />
          </button>
        </div>
        <NavLinks
          nav={nav}
          pathname={pathname}
          onNavigate={() => setDrawerOpen(false)}
        />
      </aside>

      <main className="lg:pl-64">
        <header className="sticky top-0 z-10 border-b border-gray-200 bg-white px-4 py-3 sm:px-5 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            {/* Mobile: hamburger + logo */}
            <div className="flex items-center gap-3 lg:hidden">
              <button
                aria-label="Abrir menu"
                className="rounded-lg p-2 text-uau-black hover:bg-gray-100"
                onClick={() => setDrawerOpen(true)}
              >
                <Menu size={22} />
              </button>
              <Image
                src="/logo.png"
                alt="UAU+"
                width={90}
                height={28}
                className="h-7 w-auto object-contain"
              />
            </div>
            {/* Desktop: title + user */}
            <div className="hidden lg:block">
              <h1 className="text-2xl font-bold text-uau-black">{title}</h1>
              <p className="text-sm text-uau-gray">
                {user?.name} · {user?.role}
              </p>
            </div>
            {/* Right: mobile user name + Sair */}
            <div className="flex items-center gap-3">
              <p className="max-w-[120px] truncate text-sm text-uau-gray lg:hidden">
                {user?.name}
              </p>
              <Button onClick={logout} variant="ghost">
                Sair
              </Button>
            </div>
          </div>
          {/* Mobile page title */}
          <div className="mt-2 lg:hidden">
            <h1 className="text-xl font-bold text-uau-black">{title}</h1>
          </div>
        </header>
        <div className="p-4 md:p-6 lg:p-8">
          <ErrorBoundary>{children}</ErrorBoundary>
        </div>
      </main>
    </div>
  );
}
