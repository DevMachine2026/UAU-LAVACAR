import { ButtonHTMLAttributes } from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/utils/cn";

export interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: "primary" | "ghost";
  isLoading?: boolean;
}

export function Button({ className, variant = "primary", isLoading, children, ...props }: ButtonProps) {
  const isPrimary = variant === "primary";
  
  return (
    <motion.button
      whileHover={{ scale: props.disabled || isLoading ? 1 : 1.02 }}
      whileTap={{ scale: props.disabled || isLoading ? 1 : 0.98 }}
      className={cn(
        "relative flex h-11 items-center justify-center overflow-hidden rounded-xl px-6 text-sm font-semibold transition-all duration-300",
        isPrimary 
          ? "bg-gradient-to-r from-uau-green to-emerald-500 text-white shadow-lg shadow-uau-green/20 hover:shadow-xl hover:shadow-uau-green/30" 
          : "bg-white text-uau-black border border-gray-200 hover:bg-gray-50 hover:border-gray-300",
        (props.disabled || isLoading) && "cursor-not-allowed opacity-60 hover:shadow-none",
        className
      )}
      {...props}
    >
      {isPrimary && (
        <div className="absolute inset-0 bg-white/20 opacity-0 transition-opacity duration-300 hover:opacity-10" />
      )}
      <span className="relative flex items-center gap-2">
        {isLoading && (
          <svg className="h-4 w-4 animate-spin text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {children}
      </span>
    </motion.button>
  );
}
