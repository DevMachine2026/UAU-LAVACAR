import { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost";
};

export function Button({ className = "", variant = "primary", ...props }: ButtonProps) {
  const styles =
    variant === "primary"
      ? "bg-uau-green text-white hover:bg-emerald-700"
      : "bg-white text-uau-black border border-gray-200 hover:bg-gray-50";
  return (
    <button
      className={`h-11 rounded-lg px-4 text-sm font-semibold transition disabled:opacity-60 ${styles} ${className}`}
      {...props}
    />
  );
}
