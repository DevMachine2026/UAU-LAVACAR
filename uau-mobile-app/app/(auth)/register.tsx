import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { Text, View } from "react-native";
import { z } from "zod";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Screen } from "@/components/Screen";
import { useAuthStore } from "@/auth/auth.store";
import { maskCPF, maskPhone, unmaskCPF, unmaskPhone } from "@/utils/masks";

const optionalId = z.string().trim().optional().transform((value) => (value ? value : undefined));

const registerSchema = z.object({
  name: z.string().min(2, "Informe seu nome"),
  email: z.string().min(1, "Informe seu e-mail").email("Informe um e-mail valido"),
  phone: z.string().min(8, "Informe um telefone valido"),
  cpf: z.string().min(11, "Informe um CPF valido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  stateId: optionalId,
  cityId: optionalId,
  defaultUnitId: optionalId
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const register = useAuthStore((state) => state.register);
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting }
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      cpf: "",
      password: "",
      stateId: "",
      cityId: "",
      defaultUnitId: ""
    }
  });

  async function onSubmit(data: RegisterForm) {
    try {
      await register(data);
    } catch (error) {
      setError("root", {
        message: error instanceof Error ? error.message : "Não foi possível criar seu cadastro."
      });
    }
  }

  return (
    <Screen>
      <View className="gap-5 pb-6">
        <Text className="text-3xl font-bold text-uau-black">Cadastro</Text>

        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input autoCapitalize="words" autoCorrect={false} error={errors.name?.message} label="Nome completo" onBlur={onBlur} onChangeText={onChange} returnKeyType="next" value={value} />
          )}
        />

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
              value={value}
            />
          )}
        />

        <Controller
          control={control}
          name="phone"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              error={errors.phone?.message}
              keyboardType="phone-pad"
              label="Telefone"
              maxLength={15}
              onBlur={onBlur}
              onChangeText={(text) => onChange(unmaskPhone(maskPhone(text)))}
              placeholder="(11) 99999-9999"
              returnKeyType="next"
              value={maskPhone(value)}
            />
          )}
        />

        <Controller
          control={control}
          name="cpf"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              error={errors.cpf?.message}
              keyboardType="number-pad"
              label="CPF"
              maxLength={14}
              onBlur={onBlur}
              onChangeText={(text) => onChange(unmaskCPF(maskCPF(text)))}
              placeholder="000.000.000-00"
              returnKeyType="next"
              value={maskCPF(value)}
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
              secureTextEntry
              value={value}
            />
          )}
        />

        <View className="gap-3">
          <Text className="text-sm font-semibold text-uau-gray">Localizacao opcional</Text>

          <Controller
            control={control}
            name="stateId"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input label="Estado ID" onBlur={onBlur} onChangeText={onChange} value={value} />
            )}
          />

          <Controller
            control={control}
            name="cityId"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input label="Cidade ID" onBlur={onBlur} onChangeText={onChange} value={value} />
            )}
          />

          <Controller
            control={control}
            name="defaultUnitId"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input label="Unidade padrao ID" onBlur={onBlur} onChangeText={onChange} value={value} />
            )}
          />
        </View>

        {errors.root?.message ? <Text className="text-sm text-red-600">{errors.root.message}</Text> : null}

        <Button loading={isSubmitting} onPress={handleSubmit(onSubmit)} title="Criar cadastro" />

        <Link className="font-semibold text-uau-teal" href="/(auth)/login">
          Voltar para login
        </Link>
      </View>
    </Screen>
  );
}
