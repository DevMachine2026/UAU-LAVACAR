import { cn } from "@/utils/cn";
import { ReactNode } from "react";

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div 
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/40 bg-white/70 p-6 shadow-xl shadow-uau-black/5 backdrop-blur-xl",
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/10 pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
