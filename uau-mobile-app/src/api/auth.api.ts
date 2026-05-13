import { login } from "@/features/auth/auth.api";

export async function loginRequest(email: string, password: string) {
  return login(email, password);
}
