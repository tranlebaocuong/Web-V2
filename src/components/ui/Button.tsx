import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "accent" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-all duration-200 select-none",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
          "disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed",
          // Radius
          "rounded-[12px]",
          // Touch target >= 44x44px
          "min-h-[44px]",
          // Sizes
          size === "sm" && "min-h-[40px] px-3.5 py-1.5 text-sm",
          size === "md" && "min-h-[44px] px-5 py-2.5 text-base",
          size === "lg" && "min-h-[50px] px-7 py-3 text-lg font-semibold",
          // Full width
          fullWidth && "w-full",
          // Variants
          variant === "primary" &&
            "bg-[#176B4A] text-white shadow-xs hover:bg-[#12553A] active:bg-[#0D432D]",
          variant === "secondary" &&
            "bg-[#345E88] text-white shadow-xs hover:bg-[#294B6D] active:bg-[#1F3953]",
          variant === "accent" &&
            "bg-[#D4AD69] text-[#24352E] shadow-xs font-semibold hover:bg-[#C29B57] active:bg-[#B08A46]",
          variant === "outline" &&
            "border border-[#E3E1D8] bg-transparent text-[#24352E] hover:bg-[#F8F7F2] hover:border-[#176B4A] active:bg-[#EBF4F0]",
          variant === "ghost" &&
            "bg-transparent text-[#24352E] hover:bg-black/5 active:bg-black/10",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
