"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <div className="rounded-2xl bg-white p-10 shadow-sm border border-gray-100 max-w-md w-full">
        <p className="text-5xl mb-4">⚠️</p>
        <h1 className="text-2xl font-semibold text-gray-900 mb-3">Algo deu errado</h1>
        <p className="text-gray-500 mb-8">
          Ocorreu um erro inesperado. Tente novamente ou entre em contato com o suporte.
        </p>
        <button
          onClick={reset}
          className="inline-flex h-11 items-center justify-center rounded-lg bg-uau-primary px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-uau-primaryDark"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
