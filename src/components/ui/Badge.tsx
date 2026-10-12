import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "primary" | "secondary" | "accent" | "neutral" | "outline" | "success" | "warning";
  size?: "sm" | "md";
}

export function Badge({
  className,
  variant = "primary",
  size = "md",
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center font-medium rounded-full select-none",
        size === "sm" && "px-2 py-0.5 text-xs",
        size === "md" && "px-3 py-1 text-xs",
        variant === "primary" && "bg-[#EBF4F0] text-[#176B4A] border border-[#176B4A]/20",
        variant === "secondary" && "bg-[#EAF0F6] text-[#345E88] border border-[#345E88]/20",
        variant === "accent" && "bg-[#FBF6EC] text-[#8C6D2C] border border-[#D4AD69]/30",
        variant === "neutral" && "bg-[#F0EFEA] text-[#536B61] border border-[#E3E1D8]",
        variant === "outline" && "border border-[#E3E1D8] text-[#536B61] bg-transparent",
        variant === "success" && "bg-emerald-50 text-emerald-700 border border-emerald-200",
        variant === "warning" && "bg-amber-50 text-amber-700 border border-amber-200",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
