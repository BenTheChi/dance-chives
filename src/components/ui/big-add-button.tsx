import * as React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BigAddButtonProps
  extends Omit<React.ComponentProps<typeof Button>, "variant" | "size"> {}

export function BigAddButton({ className, ...props }: BigAddButtonProps) {
  return (
    <Button
      type="button"
      className={cn(
        "bg-green-600 hover:bg-green-700 text-white border-black border-1",
        className
      )}
      size="sm"
      {...props}
    >
      <Plus className="text-white size-5" />
    </Button>
  );
}
