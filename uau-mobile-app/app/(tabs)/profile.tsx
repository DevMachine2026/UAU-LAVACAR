import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { KeyboardAvoidingView, Linking, Modal, Platform, Text, TouchableOpacity, View } from "react-native";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Screen } from "@/components/Screen";
import { useToast } from "@/components/Toast";
import { useAuthStore } from "@/auth/auth.store";
import { changePassword } from "@/features/auth/auth.api";
import { updateMyProfile } from "@/features/customers/customers.api";
import { maskPhone, unmaskPhone } from "@/utils/masks";

function translateStatus(status: string): { label: string; color: string } {
  switch (status?.toUpperCase()) {
    case "ACTIVE":   return { label: "Ativo",      color: "#0BA95B" };
    case "INACTIVE": return { label: "Inativo",    color: "#667085" };
    case "BLOCKED":  return { label: "Bloqueado",  color: "#EF4444" };
    case "SUSPECT":  return { label: "Em análise", color: "#F59E0B" };
    default:         return { label: status ?? "", color: "#667085" };
  }
}

export default function ProfileScreen() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const updateUser = useAuthStore((state) => state.updateUser);
  const toast = useToast();

  const initials = user?.name
    ? user.name.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase()
    : "U";

  // ── Edit Profile ──────────────────────────────────────────────────────────
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editNameError, setEditNameError] = useState("");
  const [editPhoneError, setEditPhoneError] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  function openEditForm() {
    setEditName(user?.name ?? "");
    setEditPhone(maskPhone(user?.phone ?? ""));
    setEditNameError("");
    setEditPhoneError("");
    setEditOpen(true);
  }

  function cancelEdit() {
    setEditOpen(false);
  }

  async function saveProfile() {
    let valid = true;
    if (editName.trim().length < 2) {
      setEditNameError("Nome deve ter pelo menos 2 caracteres.");
      valid = false;
    } else {
      setEditNameError("");
    }
    const rawPhone = unmaskPhone(editPhone);
    if (rawPhone.length < 10) {
      setEditPhoneError("Telefone deve ter pelo menos 10 dígitos.");
      valid = false;
    } else {
      setEditPhoneError("");
    }
    if (!valid) return;

    setEditLoading(true);
    try {
      const result = await updateMyProfile({ name: editName.trim(), phone: rawPhone });
      updateUser({ name: result.name, phone: result.customer?.phone ?? rawPhone });
      setEditOpen(false);
      toast.show("Perfil atualizado com sucesso", "success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao atualizar perfil.";
      toast.show(msg, "error");
    } finally {
      setEditLoading(false);
    }
  }

  // ── Change Password ───────────────────────────────────────────────────────
  const [pwdModal, setPwdModal] = useState(false);
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [currentPwdError, setCurrentPwdError] = useState("");
  const [newPwdError, setNewPwdError] = useState("");
  const [confirmPwdError, setConfirmPwdError] = useState("");
  const [pwdGenericError, setPwdGenericError] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);

  function openPwdModal() {
    setCurrentPwd("");
    setNewPwd("");
    setConfirmPwd("");
    setCurrentPwdError("");
    setNewPwdError("");
    setConfirmPwdError("");
    setPwdGenericError("");
    setPwdModal(true);
  }

  async function savePassword() {
    let valid = true;
    if (!currentPwd) {
      setCurrentPwdError("Informe a senha atual.");
      valid = false;
    } else {
      setCurrentPwdError("");
    }
    if (newPwd.length < 6) {
      setNewPwdError("Nova senha deve ter pelo menos 6 caracteres.");
      valid = false;
    } else {
      setNewPwdError("");
    }
    if (newPwd !== confirmPwd) {
      setConfirmPwdError("As senhas não coincidem.");
      valid = false;
    } else {
      setConfirmPwdError("");
    }
    if (!valid) return;

    setPwdGenericError("");
    setPwdLoading(true);
    try {
      await changePassword({ currentPassword: currentPwd, newPassword: newPwd });
      setPwdModal(false);
      toast.show("Senha alterada com sucesso", "success");
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401) {
        setCurrentPwdError("Senha atual incorreta.");
      } else {
        const apiMsg = (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message;
        setPwdGenericError(apiMsg ?? (err instanceof Error ? err.message : "Erro ao alterar senha."));
      }
    } finally {
      setPwdLoading(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Screen statusBarStyle="light">
      <View className="gap-5">
        {/* Header teal */}
        <View className="-mx-5 -mt-6 rounded-b-3xl bg-uau-teal px-5 pb-6 pt-4">
          <Text className="text-2xl font-bold text-white">Perfil</Text>
          <Text className="mt-1 text-sm text-white/80">Seus dados da conta UAU+</Text>
        </View>

        {/* Avatar + dados */}
        <View className="items-center gap-4 rounded-2xl border border-gray-100 bg-white p-6">
          <View className="h-20 w-20 items-center justify-center rounded-full bg-uau-teal">
            <Text className="text-3xl font-bold text-white">{initials}</Text>
          </View>
          <View className="items-center gap-1">
            <Text className="text-xl font-bold text-uau-black">{user?.name ?? "—"}</Text>
            <Text className="text-sm text-uau-gray">{user?.email ?? "—"}</Text>
            {user?.phone ? <Text className="text-sm text-uau-gray">{user.phone}</Text> : null}
          </View>
          {user?.status ? (() => {
            const { label, color } = translateStatus(user.status);
            return (
              <View style={{ backgroundColor: color + "20", borderRadius: 99, paddingHorizontal: 16, paddingVertical: 4 }}>
                <Text style={{ fontSize: 12, fontWeight: "600", color }}>{label}</Text>
              </View>
            );
          })() : null}
        </View>

        {/* Formulário inline de edição ou botões de ação */}
        {editOpen ? (
          <View className="gap-4 rounded-2xl border border-gray-100 bg-white p-5">
            <Text className="text-lg font-bold text-uau-black">Editar perfil</Text>
            <Input
              label="Nome"
              value={editName}
              onChangeText={setEditName}
              placeholder="Seu nome completo"
              autoCapitalize="words"
              returnKeyType="next"
              error={editNameError || undefined}
            />
            <Input
              label="Telefone"
              value={editPhone}
              onChangeText={(text) => setEditPhone(maskPhone(text))}
              placeholder="(99) 99999-9999"
              keyboardType="phone-pad"
              returnKeyType="done"
              error={editPhoneError || undefined}
            />
            <Button loading={editLoading} onPress={() => void saveProfile()} title="Salvar alterações" />
            <Button onPress={cancelEdit} title="Cancelar" variant="ghost" />
          </View>
        ) : (
          <View className="gap-3">
            <Button onPress={openEditForm} title="Editar perfil" />
            <Button onPress={openPwdModal} title="Alterar senha" variant="ghost" />
          </View>
        )}

        <View className="mt-2">
          <Button onPress={() => void logout()} title="Sair da conta" variant="ghost" />
        </View>

        <View className="items-center gap-2 pb-2 pt-4">
          <Text className="text-xs text-uau-gray">UAU+ Lavacar v1.0.0</Text>
          <TouchableOpacity
            onPress={() => void Linking.openURL("mailto:suporte@uau.app")}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text className="text-xs text-uau-teal">Precisa de ajuda? Entre em contato</Text>
          </TouchableOpacity>
        </View>

        {/* Redes sociais */}
        <View style={{ backgroundColor: "white", borderRadius: 16, borderWidth: 1, borderColor: "#F0F0F0", padding: 16, gap: 12 }}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: "#101418" }}>Siga a UAU+</Text>
          <TouchableOpacity
            onPress={() => void Linking.openURL("https://www.instagram.com/uaulavacarfortaleza")}
            style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
          >
            <Ionicons name="logo-instagram" size={20} color="#E1306C" />
            <Text style={{ fontSize: 13, color: "#101418" }}>@uaulavacarfortaleza</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => void Linking.openURL("https://wa.me/5585986532728")}
            style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
          >
            <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
            <Text style={{ fontSize: 13, color: "#101418" }}>WhatsApp</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal de troca de senha */}
      <Modal
        visible={pwdModal}
        transparent
        animationType="fade"
        onRequestClose={() => setPwdModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.5)",
              justifyContent: "center",
              paddingHorizontal: 24,
            }}
          >
            <View
              style={{
                backgroundColor: "white",
                borderRadius: 20,
                padding: 24,
                gap: 16,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: "700", color: "#1A1A1A" }}>
                Alterar senha
              </Text>
              <Input
                label="Senha atual"
                value={currentPwd}
                onChangeText={setCurrentPwd}
                secureTextEntry
                returnKeyType="next"
                error={currentPwdError || undefined}
              />
              <Input
                label="Nova senha"
                value={newPwd}
                onChangeText={setNewPwd}
                secureTextEntry
                returnKeyType="next"
                error={newPwdError || undefined}
              />
              <Input
                label="Confirmar nova senha"
                value={confirmPwd}
                onChangeText={setConfirmPwd}
                secureTextEntry
                returnKeyType="done"
                error={confirmPwdError || undefined}
              />
              {pwdGenericError ? (
                <Text style={{ color: "#C62828", fontSize: 13 }}>{pwdGenericError}</Text>
              ) : null}
              <Button
                loading={pwdLoading}
                onPress={() => void savePassword()}
                title="Salvar nova senha"
              />
              <Button onPress={() => setPwdModal(false)} title="Cancelar" variant="ghost" />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Screen>
  );
}
