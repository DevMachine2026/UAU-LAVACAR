"use client";

import { useEffect } from "react";
import { Card } from "./Card";

type ToastVariant = "success" | "error";

type ToastProps = {
  message: string;
  onDismiss: () => void;
  duration?: number;
  variant?: ToastVariant;
};

export function Toast({
  message,
  onDismiss,
  duration = 5000,
  variant = "success",
}: ToastProps) {
  useEffect(() => {
    if (!message) return;
    const id = setTimeout(onDismiss, duration);
    return () => clearTimeout(id);
  }, [message, duration, onDismiss]);

  if (!message) return null;
  return (
    <Card
      className={
        variant === "error"
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-green-200 bg-green-50 text-green-700"
      }
    >
      {message}
    </Card>
  );
}
