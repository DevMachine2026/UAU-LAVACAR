import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { Text, View } from "react-native";
import { z } from "zod";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Screen } from "@/components/Screen";
import { forgotPassword } from "@/features/auth/auth.api";

const schema = z.object({
  email: z.string().min(1, "Informe seu e-mail").email("Informe um e-mail válido"),
});

type Form = z.infer<typeof schema>;

export default function ForgotPasswordScreen() {
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  async function onSubmit(data: Form) {
    try {
      const result = await forgotPassword(data.email);
      router.push({
        pathname: "/(auth)/reset-password",
        params: { resetToken: result.resetToken, email: data.email },
      });
    } catch (error) {
      setError("root", {
        message: error instanceof Error ? error.message : "Não foi possível enviar o e-mail.",
      });
    }
  }

  return (
    <Screen>
      <View className="flex-1 justify-center gap-8">
        <View className="gap-3">
          <Text className="text-4xl font-bold text-uau-black">Recuperar senha</Text>
          <Text className="text-base leading-6 text-uau-gray">
            Informe seu e-mail e enviaremos um código de 6 dígitos para redefinir sua senha.
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

          {errors.root?.message ? (
            <Text className="text-sm text-red-600">{errors.root.message}</Text>
          ) : null}

          <Button loading={isSubmitting} onPress={handleSubmit(onSubmit)} title="Enviar código" />

          <Button onPress={() => router.back()} title="Voltar ao login" variant="ghost" />
        </View>
      </View>
    </Screen>
  );
}
