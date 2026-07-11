import { zodResolver } from "@hookform/resolvers/zod";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Link } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";
import { useAuthStore } from "@/auth/auth.store";

const loginSchema = z.object({
  email: z.string().min(1, "Informe seu e-mail").email("E-mail inválido"),
  password: z.string().min(1, "Informe sua senha"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const login = useAuthStore((state) => state.login);
  const [showPassword, setShowPassword] = useState(false);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(data: LoginForm) {
    try {
      await login(data.email, data.password);
    } catch (error) {
      setError("root", {
        message:
          error instanceof Error
            ? error.message
            : "Não foi possível entrar. Confira seus dados.",
      });
    }
  }

  return (
    <View className="flex-1">
      <StatusBar barStyle="light-content" />

      {/* Hero teal */}
      <LinearGradient
        colors={["#009688", "#00695C"]}
        style={{ paddingBottom: 60 }}
      >
        <SafeAreaView edges={["top"]}>
          <View className="items-center px-6 pb-2 pt-10">
            <Image
              source={require("../../assets/adaptive-icon-original.png")}
              style={{ width: 88, height: 88, borderRadius: 20 }}
              resizeMode="contain"
            />
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Card branco sobrepondo o hero */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
        style={{ marginTop: -40 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View
            className="flex-1 bg-white px-6 pt-8"
            style={{ borderTopLeftRadius: 32, borderTopRightRadius: 32 }}
          >
            <Text className="text-2xl font-bold text-gray-900">
              Bem-vindo de volta
            </Text>
            <Text className="mt-1 text-sm text-gray-500">
              Entre com seu e-mail e senha
            </Text>

            <View className="mt-8 gap-4">
              {/* Campo e-mail */}
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View className="gap-1.5">
                    <Text className="text-sm font-medium text-gray-700">
                      E-mail
                    </Text>
                    <View
                      className={`flex-row items-center rounded-xl border bg-gray-50 px-4 ${
                        errors.email ? "border-red-400" : "border-gray-200"
                      }`}
                      style={{ height: 52 }}
                    >
                      <Ionicons name="mail-outline" size={18} color="#9CA3AF" />
                      <TextInput
                        autoCapitalize="none"
                        autoComplete="email"
                        className="ml-3 flex-1 text-base text-gray-900"
                        keyboardType="email-address"
                        onBlur={onBlur}
                        onChangeText={onChange}
                        placeholder="voce@email.com"
                        placeholderTextColor="#9CA3AF"
                        value={value}
                      />
                    </View>
                    {errors.email?.message ? (
                      <Text className="text-xs text-red-500">
                        {errors.email.message}
                      </Text>
                    ) : null}
                  </View>
                )}
              />

              {/* Campo senha */}
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View className="gap-1.5">
                    <Text className="text-sm font-medium text-gray-700">
                      Senha
                    </Text>
                    <View
                      className={`flex-row items-center rounded-xl border bg-gray-50 px-4 ${
                        errors.password ? "border-red-400" : "border-gray-200"
                      }`}
                      style={{ height: 52 }}
                    >
                      <Ionicons
                        name="lock-closed-outline"
                        size={18}
                        color="#9CA3AF"
                      />
                      <TextInput
                        className="ml-3 flex-1 text-base text-gray-900"
                        onBlur={onBlur}
                        onChangeText={onChange}
                        placeholder="Sua senha"
                        placeholderTextColor="#9CA3AF"
                        secureTextEntry={!showPassword}
                        value={value}
                      />
                      <Pressable
                        hitSlop={8}
                        onPress={() => setShowPassword((v) => !v)}
                      >
                        <Ionicons
                          name={showPassword ? "eye-off-outline" : "eye-outline"}
                          size={18}
                          color="#9CA3AF"
                        />
                      </Pressable>
                    </View>
                    {errors.password?.message ? (
                      <Text className="text-xs text-red-500">
                        {errors.password.message}
                      </Text>
                    ) : null}
                  </View>
                )}
              />

              <Link
                className="self-end text-sm font-medium text-uau-teal"
                href="/(auth)/forgot-password"
              >
                Esqueci minha senha
              </Link>

              {errors.root?.message ? (
                <View className="rounded-xl bg-red-50 px-4 py-3">
                  <Text className="text-sm text-red-600">
                    {errors.root.message}
                  </Text>
                </View>
              ) : null}

              {/* Botão entrar */}
              <Pressable
                onPress={handleSubmit(onSubmit)}
                disabled={isSubmitting}
                style={({ pressed }) => ({ opacity: pressed || isSubmitting ? 0.75 : 1 })}
              >
                <LinearGradient
                  colors={["#009688", "#00695C"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    height: 52,
                    borderRadius: 14,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text className="text-base font-bold text-white">
                    {isSubmitting ? "Entrando..." : "Entrar"}
                  </Text>
                </LinearGradient>
              </Pressable>

              <View className="items-center pt-2">
                <Link href="/(auth)/register" asChild>
                  <Pressable style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
                    <Text className="text-sm text-gray-500">
                      Não tem conta?{" "}
                      <Text className="font-semibold text-uau-teal">Criar cadastro</Text>
                    </Text>
                  </Pressable>
                </Link>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
