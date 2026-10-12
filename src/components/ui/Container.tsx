import React from "react";
import { cn } from "@/lib/utils";

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "default" | "reader" | "narrow" | "full";
}

export function Container({
  size = "default",
  className,
  children,
  ...props
}: ContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 sm:px-6 lg:px-8",
        size === "default" && "max-w-[1200px]",
        size === "reader" && "max-w-[740px]",
        size === "narrow" && "max-w-[900px]",
        size === "full" && "max-w-full",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
