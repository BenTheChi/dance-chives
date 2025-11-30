import * as React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SmallAddButtonProps = Omit<
  React.ComponentProps<typeof Button>,
  "variant" | "size"
>;

export function SmallAddButton({ className, ...props }: SmallAddButtonProps) {
  return (
    <Button
      type="button"
      className={cn(
        "bg-green-600 hover:bg-green-700 text-white border-black border-1",
        className
      )}
      size="icon"
      {...props}
    >
      <Plus className="text-white size-3" />
    </Button>
  );
}
