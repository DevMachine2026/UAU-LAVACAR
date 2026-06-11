import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <div className="rounded-2xl bg-white p-10 shadow-sm border border-gray-100 max-w-md w-full">
        <p className="text-6xl font-bold text-uau-green mb-2">404</p>
        <h1 className="text-2xl font-semibold text-gray-900 mb-3">Página não encontrada</h1>
        <p className="text-gray-500 mb-8">
          O endereço que você acessou não existe ou foi movido.
        </p>
        <Link
          href="/"
          className="inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-uau-green to-emerald-500 px-6 text-sm font-semibold text-white shadow-lg transition-all hover:opacity-90"
        >
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}
