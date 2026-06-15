import { zodResolver } from "@hookform/resolvers/zod";
import { router, useLocalSearchParams } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { Text, View } from "react-native";
import { z } from "zod";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Screen } from "@/components/Screen";
import { resetPassword } from "@/features/auth/auth.api";

const schema = z
  .object({
    code: z.string().length(6, "O código deve ter 6 dígitos"),
    newPassword: z.string().min(8, "A senha deve ter pelo menos 8 caracteres"),
    confirmPassword: z.string().min(1, "Confirme sua senha"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });

type Form = z.infer<typeof schema>;

export default function ResetPasswordScreen() {
  const { resetToken, email } = useLocalSearchParams<{ resetToken: string; email: string }>();

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { code: "", newPassword: "", confirmPassword: "" },
  });

  async function onSubmit(data: Form) {
    try {
      await resetPassword(resetToken ?? "", data.code, data.newPassword);
      router.replace("/(auth)/login");
    } catch (error) {
      setError("root", {
        message: error instanceof Error ? error.message : "Não foi possível redefinir a senha.",
      });
    }
  }

  return (
    <Screen>
      <View className="flex-1 justify-center gap-8">
        <View className="gap-3">
          <Text className="text-4xl font-bold text-uau-black">Nova senha</Text>
          <Text className="text-base leading-6 text-uau-gray">
            Enviamos um código de 6 dígitos para{" "}
            <Text className="font-semibold text-uau-black">{email}</Text>. Informe o código e sua nova senha.
          </Text>
        </View>

        <View className="gap-4">
          <Controller
            control={control}
            name="code"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                error={errors.code?.message}
                keyboardType="number-pad"
                label="Código (6 dígitos)"
                maxLength={6}
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="123456"
                value={value}
              />
            )}
          />

          <Controller
            control={control}
            name="newPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                error={errors.newPassword?.message}
                label="Nova senha"
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="Mínimo 8 caracteres"
                secureTextEntry
                value={value}
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                error={errors.confirmPassword?.message}
                label="Confirmar nova senha"
                onBlur={onBlur}
                onChangeText={onChange}
                placeholder="Repita a senha"
                secureTextEntry
                value={value}
              />
            )}
          />

          {errors.root?.message ? (
            <Text className="text-sm text-red-600">{errors.root.message}</Text>
          ) : null}

          <Button loading={isSubmitting} onPress={handleSubmit(onSubmit)} title="Redefinir senha" />

          <Button onPress={() => router.replace("/(auth)/login")} title="Voltar ao login" variant="ghost" />
        </View>
      </View>
    </Screen>
  );
}
