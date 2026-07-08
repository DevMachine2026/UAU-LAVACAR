import Link from "next/link";
import type { Metadata } from "next";
import { Mail, MessageCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Suporte | UAU+ Lavacar",
  description: "Canais de atendimento e suporte da UAU+ Lavacar."
};

const WHATSAPP_SUPORTE = "5585986532728";
const WHATSAPP_SUPORTE_LABEL = "+55 85 98653-2728";
const EMAIL_SUPORTE = "contato@uaulavacar.com.br";

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-[#f5f7fa] px-4 py-12">
      <div className="mx-auto max-w-2xl rounded-2xl border border-gray-100 bg-white p-8 shadow-sm sm:p-12">
        <Link href="/" className="text-sm font-medium text-uau-primary hover:underline">
          ← Voltar ao início
        </Link>

        <h1 className="mt-6 mb-2 text-2xl font-bold text-uau-black">Central de Suporte</h1>
        <p className="mb-8 text-sm text-uau-gray">
          Precisa de ajuda com sua conta, assinatura, cobrança, veículo cadastrado ou algum
          atendimento em uma unidade UAU+ Lavacar? Fale com a gente por um dos canais abaixo.
        </p>

        <div className="space-y-4">
          <a
            href={`https://wa.me/${WHATSAPP_SUPORTE}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 rounded-xl border border-gray-200 p-4 transition-colors hover:border-uau-primary hover:bg-uau-primary/5"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#25D366]/10">
              <MessageCircle size={20} className="text-[#25D366]" />
            </div>
            <div>
              <p className="font-semibold text-uau-black">WhatsApp</p>
              <p className="text-sm text-uau-gray">{WHATSAPP_SUPORTE_LABEL}</p>
            </div>
          </a>

          <a
            href={`mailto:${EMAIL_SUPORTE}`}
            className="flex items-center gap-4 rounded-xl border border-gray-200 p-4 transition-colors hover:border-uau-primary hover:bg-uau-primary/5"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-uau-primary/10">
              <Mail size={20} className="text-uau-primary" />
            </div>
            <div>
              <p className="font-semibold text-uau-black">E-mail</p>
              <p className="text-sm text-uau-gray">{EMAIL_SUPORTE}</p>
            </div>
          </a>
        </div>

        <p className="mt-8 text-xs text-uau-gray">
          Atendimento destinado a usuários do app UAU+ Lavacar, clientes, assinantes e pessoas
          que precisem exercer direitos relacionados aos seus dados pessoais.{" "}
          Para saber como tratamos seus dados pessoais, consulte nossa{" "}
          <Link href="/privacidade" className="font-medium text-uau-primary hover:underline">
            Política de Privacidade
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
