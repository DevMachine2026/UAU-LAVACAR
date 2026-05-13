"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoadingState } from "@/components/State";
import { useAuthStore } from "@/auth/auth.store";

export function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles: string[] }) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const restoreSession = useAuthStore((state) => state.restoreSession);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login");
    if (!isLoading && user && !roles.includes(user.role)) router.replace("/login");
  }, [isLoading, isAuthenticated, router, roles, user]);

  if (isLoading || !isAuthenticated || !user || !roles.includes(user.role)) {
    return <div className="p-5"><LoadingState /></div>;
  }

  return <>{children}</>;
}
