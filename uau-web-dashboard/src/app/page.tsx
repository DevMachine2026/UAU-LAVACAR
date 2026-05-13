"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoadingState } from "@/components/State";
import { getRoleHome, useAuthStore } from "@/auth/auth.store";

export default function HomePage() {
  const router = useRouter();
  const restoreSession = useAuthStore((state) => state.restoreSession);
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    if (!isLoading) router.replace(getRoleHome(user?.role));
  }, [isLoading, router, user?.role]);

  return <div className="p-5"><LoadingState /></div>;
}
