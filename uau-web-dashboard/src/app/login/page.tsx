"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { getRoleHome, useAuthStore } from "@/auth/auth.store";

const schema = z.object({
  email: z.string().email("Informe um e-mail valido"),
  password: z.string().min(1, "Informe a senha")
});

type LoginForm = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting }
  } = useForm<LoginForm>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "" } });

  async function onSubmit(data: LoginForm) {
    try {
      const user = await login(data.email, data.password);
      router.replace(getRoleHome(user.role));
    } catch (error) {
      setError("root", { message: error instanceof Error ? error.message : "Nao foi possivel entrar" });
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-uau-light p-5">
      <Card className="w-full max-w-md">
        <div className="mb-8">
          <p className="text-4xl font-bold text-uau-black">UAU+</p>
          <p className="mt-2 text-uau-gray">Painel web multiportal</p>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="text-sm font-semibold text-uau-black">E-mail</label>
            <input className="mt-2 h-11 w-full rounded-lg border border-gray-300 px-3" {...register("email")} />
            {errors.email ? <p className="mt-1 text-sm text-red-600">{errors.email.message}</p> : null}
          </div>
          <div>
            <label className="text-sm font-semibold text-uau-black">Senha</label>
            <input className="mt-2 h-11 w-full rounded-lg border border-gray-300 px-3" type="password" {...register("password")} />
            {errors.password ? <p className="mt-1 text-sm text-red-600">{errors.password.message}</p> : null}
          </div>
          {errors.root ? <p className="text-sm text-red-600">{errors.root.message}</p> : null}
          <Button className="w-full" disabled={isSubmitting} type="submit">{isSubmitting ? "Entrando..." : "Entrar"}</Button>
        </form>
      </Card>
    </main>
  );
}
