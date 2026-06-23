"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  Menu,
  X,
  LayoutDashboard,
  Users,
  CreditCard,
  Car,
  BarChart2,
  Settings,
  UserCheck,
  Clock,
  Camera,
  Search,
  Handshake,
  type LucideIcon,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/Button";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useAuthStore } from "@/auth/auth.store";

type NavItem = { href: string; label: string; icon: LucideIcon };
type NavSection = { sectionLabel?: string; items: NavItem[] };

const NAV_SECTIONS_BY_ROLE: Record<string, NavSection[]> = {
  SUPER_ADMIN: [
    {
      items: [
        { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
        { href: "/admin/customers", label: "Clientes", icon: Users },
        { href: "/admin/plans", label: "Planos", icon: CreditCard },
        { href: "/admin/operations", label: "Operações", icon: Car },
      ],
    },
    {
      sectionLabel: "GESTÃO",
      items: [
        { href: "/admin/financial", label: "Financeiro", icon: BarChart2 },
        { href: "/admin/settings", label: "Configurações", icon: Settings },
      ],
    },
  ],
  FRANCHISE_OWNER: [
    {
      items: [
        { href: "/franchise", label: "Minha Franquia", icon: LayoutDashboard },
        { href: "/franchise/customers", label: "Clientes", icon: Users },
        { href: "/franchise/staff", label: "Equipe", icon: UserCheck },
        { href: "/franchise/operations", label: "Operações", icon: Car },
        { href: "/operator", label: "Operador", icon: Settings },
        { href: "/operator/anpr", label: "ANPR", icon: Camera },
        { href: "/operator/shifts", label: "Expedientes", icon: Clock },
        { href: "/operator/plate-check", label: "Placas", icon: Search },
      ],
    },
  ],
  PARTNER: [
    {
      items: [{ href: "/partner", label: "Meu Parceiro", icon: Handshake }],
    },
  ],
  OPERATOR: [
    {
      items: [
        { href: "/operator", label: "Operação", icon: Car },
        { href: "/operator/shifts", label: "Expedientes", icon: Clock },
        { href: "/operator/anpr", label: "ANPR", icon: Camera },
        { href: "/operator/plate-check", label: "Placas", icon: Search },
      ],
    },
  ],
};

function NavLinks({
  sections,
  pathname,
  onNavigate,
}: {
  sections: NavSection[];
  pathname: string;
  onNavigate: () => void;
}) {
  return (
    <nav className="space-y-4">
      {sections.map((section, idx) => (
        <div key={idx}>
          {section.sectionLabel && (
            <div className="mb-2">
              <hr className="mb-3 border-white/20" />
              <p className="px-4 text-xs font-semibold uppercase tracking-wider text-white/50">
                {section.sectionLabel}
              </p>
            </div>
          )}
          <div className="space-y-1">
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                    pathname === item.href
                      ? "bg-uau-primaryDark text-white"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                  href={item.href}
                  key={item.href}
                  onClick={onNavigate}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
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
  const sections = NAV_SECTIONS_BY_ROLE[user?.role ?? ""] ?? [];
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
        <NavLinks sections={sections} pathname={pathname} onNavigate={() => {}} />
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
          sections={sections}
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
            {/* Desktop: page title + welcome */}
            <div className="hidden lg:block">
              <h1 className="text-2xl font-bold text-uau-black">{title}</h1>
              <p className="text-sm text-uau-gray">Bem-vindo, {user?.name}</p>
            </div>
            {/* Right: Sair button */}
            <Button onClick={logout} variant="ghost">
              Sair
            </Button>
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
