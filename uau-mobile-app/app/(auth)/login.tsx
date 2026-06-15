import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { Text, View } from "react-native";
import { z } from "zod";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Screen } from "@/components/Screen";
import { useAuthStore } from "@/auth/auth.store";

const loginSchema = z.object({
  email: z.string().min(1, "Informe seu e-mail").email("Informe um e-mail válido"),
  password: z.string().min(1, "Informe sua senha")
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const login = useAuthStore((state) => state.login);
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting }
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" }
  });

  async function onSubmit(data: LoginForm) {
    try {
      await login(data.email, data.password);
    } catch (error) {
      setError("root", {
        message: error instanceof Error ? error.message : "Não foi possível entrar. Confira seus dados."
      });
    }
  }

  return (
    <Screen>
      <View className="flex-1 justify-center gap-8">
        <View className="gap-3">
          <Text className="text-4xl font-bold text-uau-black">UAU+</Text>
          <Text className="text-base leading-6 text-uau-gray">
            Entre para acompanhar sua assinatura, cashback, cobrancas e rede.
          </Text>
        </View>

        <View className="gap-4">
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                autoCapitalize="none"
                autoComplete="email"
                error={errors.email?.message}
                keyboardType="email-address"
                label="E-mail"
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="voce@email.com"
                value={value}
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                error={errors.password?.message}
                label="Senha"
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="Sua senha"
                secureTextEntry
                value={value}
              />
            )}
          />

          {errors.root?.message ? <Text className="text-sm text-red-600">{errors.root.message}</Text> : null}

          <Button loading={isSubmitting} onPress={handleSubmit(onSubmit)} title="Entrar" />
          <Link className="text-center font-semibold text-uau-green" href="/(auth)/register">
            Criar cadastro
          </Link>
          <Link className="text-center text-sm text-uau-gray" href="/(auth)/forgot-password">
            Esqueci minha senha
          </Link>
        </View>
      </View>
    </Screen>
  );
}
