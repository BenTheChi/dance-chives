"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { StyleBadge } from "@/components/ui/style-badge";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { DANCE_STYLES } from "@/lib/utils/dance-styles";
import {
  formatStyleNameForDisplay,
  normalizeStyleNames,
} from "@/lib/utils/style-utils";

interface StyleMultiSelectProps {
  value: string[];
  onChange: (styles: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
  selectedStylesLayout?: "wrap" | "single-row";
}

export function StyleMultiSelect({
  value,
  onChange,
  disabled = false,
  placeholder = "Select styles...",
  selectedStylesLayout = "wrap",
}: StyleMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const canonicalValue = useMemo(
    () => normalizeStyleNames(value, { strict: false }),
    [value]
  );

  const handleSelect = (style: string) => {
    const isSelected = canonicalValue.includes(style);
    if (isSelected) {
      onChange(canonicalValue.filter((s) => s !== style));
    } else {
      onChange([...canonicalValue, style]);
    }
  };

  const removeStyle = (style: string) => {
    onChange(canonicalValue.filter((s) => s !== style));
  };

  return (
    <div className="">
      <div
        className={cn(
          selectedStylesLayout === "single-row"
            ? "mb-1 flex h-8 items-center gap-1 overflow-x-auto overflow-y-hidden whitespace-nowrap"
            : "flex flex-wrap gap-1"
        )}
      >
        {canonicalValue.map((style) => (
          <StyleBadge
            key={style}
            style={style}
            asLink={false}
            showRemoveButton={!disabled}
            onRemove={() => removeStyle(style)}
            className={cn(
              selectedStylesLayout === "single-row"
                ? "shrink-0 whitespace-nowrap"
                : "mb-1"
            )}
          />
        ))}
      </div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between bg-neutral-300",
              canonicalValue.length === 0 ? "text-charcoal" : "text-black"
            )}
            disabled={disabled}
          >
            {placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-black" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Search styles..." />
            <CommandList>
              <CommandEmpty>No styles found.</CommandEmpty>
              <CommandGroup>
                {DANCE_STYLES.map((style) => {
                  const isSelected = canonicalValue.includes(style);
                  return (
                    <CommandItem
                      key={style}
                      onSelect={() => handleSelect(style)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          isSelected ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {formatStyleNameForDisplay(style)}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {/* Hidden input for form submission */}
      <input
        type="hidden"
        name="styles"
        value={JSON.stringify(canonicalValue)}
      />
    </div>
  );
}
