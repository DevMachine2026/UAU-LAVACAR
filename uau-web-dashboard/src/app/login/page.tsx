"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { getRoleHome, useAuthStore } from "@/auth/auth.store";
import { motion } from "framer-motion";
import { Mail, Lock, ShieldCheck, AlertCircle } from "lucide-react";

const schema = z.object({
  email: z.string().email("Informe um e-mail válido"),
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
      setError("root", { message: error instanceof Error ? error.message : "Não foi possível entrar" });
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const } }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-uau-light p-5">
      {/* Background Orbs */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-emerald-400 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob" />
      <div className="absolute top-0 -right-4 w-72 h-72 bg-teal-400 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-uau-green rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-blob animation-delay-4000" />

      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="relative z-10 w-full max-w-md"
      >
        <Card className="w-full">
          <motion.div variants={itemVariants} className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-uau-green to-emerald-400 text-white shadow-lg shadow-uau-green/30">
              <ShieldCheck size={32} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-uau-black">Bem-vindo ao UAU+</h1>
            <p className="mt-2 text-uau-gray/80">Painel Operacional & Antifraude</p>
          </motion.div>

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            <motion.div variants={itemVariants}>
              <Input
                label="E-mail"
                placeholder="seu@email.com"
                icon={<Mail size={20} />}
                error={errors.email?.message}
                {...register("email")}
              />
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <Input
                label="Senha"
                type="password"
                placeholder="••••••••"
                icon={<Lock size={20} />}
                error={errors.password?.message}
                {...register("password")}
              />
            </motion.div>

            {errors.root && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600"
              >
                <AlertCircle size={18} />
                {errors.root.message}
              </motion.div>
            )}

            <motion.div variants={itemVariants} className="pt-2">
              <Button className="w-full" isLoading={isSubmitting} type="submit">
                Entrar no Sistema
              </Button>
            </motion.div>
          </form>
        </Card>
      </motion.div>
    </main>
  );
}
