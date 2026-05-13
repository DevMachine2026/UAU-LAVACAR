import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "@/store/AppProviders";

export const metadata: Metadata = {
  title: "UAU+ Dashboard",
  description: "Painel web multiportal da UAU+"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
