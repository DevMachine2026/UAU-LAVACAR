import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Alert, KeyboardAvoidingView, Linking, Modal, Platform, Text, TouchableOpacity, View } from "react-native";
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

type SettingsItemProps = {
  icon: string;
  label: string;
  iconBg: string;
  iconColor: string;
  labelColor?: string;
  onPress: () => void;
  showChevron?: boolean;
};

function SettingsItem({
  icon, label, iconBg, iconColor,
  labelColor = "#101418", onPress, showChevron = true,
}: SettingsItemProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{ flexDirection: "row", alignItems: "center", padding: 16 }}
    >
      <View style={{
        width: 40, height: 40, borderRadius: 10,
        backgroundColor: iconBg, alignItems: "center", justifyContent: "center",
      }}>
        <Ionicons name={icon as any} size={20} color={iconColor} />
      </View>
      <Text style={{ marginLeft: 12, fontSize: 15, fontWeight: "600", color: labelColor, flex: 1 }}>
        {label}
      </Text>
      {showChevron && <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />}
    </TouchableOpacity>
  );
}

function Separator() {
  return <View style={{ height: 1, backgroundColor: "#E5E7EB", marginLeft: 68 }} />;
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
    if (newPwd.length < 8) {
      setNewPwdError("Senha deve ter no mínimo 8 caracteres");
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
      <View style={{ gap: 16 }}>

        {/* Header */}
        <View className="-mx-5 -mt-6 rounded-b-3xl bg-uau-teal px-5 pb-6 pt-4">
          <Text className="text-2xl font-bold text-white">Perfil</Text>
          <Text className="mt-1 text-sm text-white/80">Seus dados da conta UAU+</Text>
        </View>

        {/* Card do usuário */}
        <View style={{
          backgroundColor: "white", borderRadius: 16, padding: 20,
          alignItems: "center", borderWidth: 1, borderColor: "#E5E7EB",
        }}>
          <View style={{
            width: 60, height: 60, borderRadius: 30,
            backgroundColor: "#009688", alignItems: "center", justifyContent: "center",
          }}>
            <Text style={{ color: "white", fontSize: 22, fontWeight: "700" }}>{initials}</Text>
          </View>
          <Text style={{ fontSize: 17, fontWeight: "700", color: "#101418", marginTop: 10 }}>
            {user?.name ?? "—"}
          </Text>
          <Text style={{ fontSize: 13, color: "#667085", marginTop: 2 }}>
            {user?.email ?? "—"}
          </Text>
          {user?.phone ? (
            <Text style={{ fontSize: 13, color: "#667085", marginTop: 2 }}>{user.phone}</Text>
          ) : null}
          {user?.status ? (() => {
            const { label, color } = translateStatus(user.status);
            return (
              <View style={{
                backgroundColor: color + "1A", borderRadius: 20,
                paddingHorizontal: 12, paddingVertical: 4, marginTop: 8,
              }}>
                <Text style={{ fontSize: 12, fontWeight: "600", color }}>{label}</Text>
              </View>
            );
          })() : null}
        </View>

        {/* Formulário de edição — visível quando editOpen */}
        {editOpen ? (
          <View style={{
            backgroundColor: "white", borderRadius: 16, padding: 20,
            borderWidth: 1, borderColor: "#E5E7EB", gap: 16,
          }}>
            <Text style={{ fontSize: 17, fontWeight: "700", color: "#101418" }}>Editar perfil</Text>
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
        ) : null}

        {/* Card de ações (lista agrupada) */}
        {!editOpen ? (
          <View style={{
            backgroundColor: "white", borderRadius: 16,
            overflow: "hidden", borderWidth: 1, borderColor: "#E5E7EB",
          }}>
            <SettingsItem
              icon="person-outline"
              label="Editar perfil"
              iconBg="rgba(0,150,136,0.09)"
              iconColor="#009688"
              onPress={openEditForm}
            />
            <Separator />
            <SettingsItem
              icon="lock-closed-outline"
              label="Alterar senha"
              iconBg="rgba(0,150,136,0.09)"
              iconColor="#009688"
              onPress={openPwdModal}
            />
            <View style={{ height: 2, backgroundColor: "#F5F7FA" }} />
            <SettingsItem
              icon="log-out-outline"
              label="Sair da conta"
              iconBg="rgba(217,45,32,0.09)"
              iconColor="#D92D20"
              labelColor="#D92D20"
              onPress={() => Alert.alert(
                'Sair da conta',
                'Tem certeza que deseja sair?',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Sair', style: 'destructive', onPress: logout },
                ]
              )}
              showChevron={false}
            />
          </View>
        ) : null}

        {/* Card de suporte e redes sociais */}
        <View style={{
          backgroundColor: "white", borderRadius: 16,
          overflow: "hidden", borderWidth: 1, borderColor: "#E5E7EB",
        }}>
          <SettingsItem
            icon="logo-whatsapp"
            label="Falar com suporte"
            iconBg="rgba(37,211,102,0.09)"
            iconColor="#25D366"
            onPress={() => void Linking.openURL("https://wa.me/5585986532728")}
          />
          <Separator />
          <SettingsItem
            icon="logo-instagram"
            label="Seguir no Instagram"
            iconBg="rgba(225,48,108,0.09)"
            iconColor="#E1306C"
            onPress={() => void Linking.openURL("https://www.instagram.com/uaulavacarfortaleza")}
          />
        </View>

        {/* Rodapé */}
        <Text style={{
          textAlign: "center", fontSize: 12, color: "#667085",
          marginTop: 8, marginBottom: 24,
        }}>
          UAU+ Lavacar v1.0.0
        </Text>

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
          <View style={{
            flex: 1, backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center", paddingHorizontal: 24,
          }}>
            <View style={{
              backgroundColor: "white", borderRadius: 20, padding: 24, gap: 16,
            }}>
              <Text style={{ fontSize: 18, fontWeight: "700", color: "#101418" }}>
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
                <Text style={{ color: "#D92D20", fontSize: 13 }}>{pwdGenericError}</Text>
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
