"use client";

import { useEffect } from "react";
import { Card } from "./Card";

type ToastProps = {
  message: string;
  onDismiss: () => void;
  duration?: number;
};

export function Toast({ message, onDismiss, duration = 5000 }: ToastProps) {
  useEffect(() => {
    if (!message) return;
    const id = setTimeout(onDismiss, duration);
    return () => clearTimeout(id);
  }, [message, duration, onDismiss]);

  if (!message) return null;
  return <Card className="border-[#0BA95B]/30 text-[#0BA95B]">{message}</Card>;
}
