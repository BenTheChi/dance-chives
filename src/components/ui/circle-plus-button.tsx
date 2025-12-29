import * as React from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const sizeClasses = {
  sm: "w-6 h-6",
  md: "w-8 h-8",
  lg: "w-[50px] h-[50px]",
} as const;

const iconSizes = {
  sm: "w-3 h-3",
  md: "w-4 h-4",
  lg: "w-6 h-6",
} as const;

interface CirclePlusButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: keyof typeof sizeClasses;
}

export function CirclePlusButton({
  size = "md",
  className,
  ...props
}: CirclePlusButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "rounded-full flex items-center justify-center",
        "bg-accent-yellow",
        "text-black",
        "border border-charcoal",
        "transition-shadow duration-150",
        "hover:glow",
        "hover:scale-130",
        "transition-transform duration-150",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-pulse-green focus-visible:ring-offset-2",
        "cursor-pointer",
        sizeClasses[size],
        className
      )}
      {...props}
    >
      <Plus className={cn(iconSizes[size], "stroke-[3.5]")} />
    </button>
  );
}
