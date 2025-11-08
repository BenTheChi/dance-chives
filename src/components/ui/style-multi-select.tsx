"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
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
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { DANCE_STYLES } from "@/lib/utils/dance-styles";

interface StyleMultiSelectProps {
  value: string[];
  onChange: (styles: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
  name?: string;
}

export function StyleMultiSelect({
  value,
  onChange,
  disabled = false,
  placeholder = "Select styles...",
  name,
}: StyleMultiSelectProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (style: string) => {
    const isSelected = value.includes(style);
    if (isSelected) {
      onChange(value.filter((s) => s !== style));
    } else {
      onChange([...value, style]);
    }
  };

  const removeStyle = (style: string) => {
    onChange(value.filter((s) => s !== style));
  };

  return (
    <div className="space-y-2">
      {name && (
        <label className="text-sm font-medium block">{name}</label>
      )}
      <div className="flex flex-wrap gap-1 mb-2">
        {value.map((style) => (
          <Badge
            key={style}
            variant="secondary"
            className="flex items-center gap-1 hover:bg-secondary/80 transition-colors"
          >
            {style}
            {!disabled && (
              <button
                type="button"
                onClick={() => removeStyle(style)}
                className="ml-1 hover:bg-secondary/90 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </Badge>
        ))}
      </div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
          >
            {placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Search styles..." />
            <CommandList>
              <CommandEmpty>No styles found.</CommandEmpty>
              <CommandGroup>
                {DANCE_STYLES.map((style) => {
                  const isSelected = value.includes(style);
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
                      {style}
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
        name={name || "styles"}
        value={JSON.stringify(value)}
      />
    </div>
  );
}

