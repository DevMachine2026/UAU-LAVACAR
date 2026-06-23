import { InputHTMLAttributes, forwardRef, ReactNode } from "react";
import { cn } from "@/utils/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-2 block text-sm font-medium text-uau-black">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-3 text-uau-gray/60">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              "flex h-11 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-uau-black transition-all duration-200",
              "focus:border-uau-primary focus:outline-none focus:ring-4 focus:ring-uau-primary/20",
              "disabled:cursor-not-allowed disabled:opacity-50",
              icon && "pl-10",
              error && "border-red-500 focus:border-red-500 focus:ring-red-500/20",
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="mt-1.5 text-sm font-medium text-red-500 animate-fade-in">{error}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";
