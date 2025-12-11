"use client";

import { useState } from "react";
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
import { formatStyleNameForDisplay } from "@/lib/utils/style-utils";

interface StyleMultiSelectProps {
  value: string[];
  onChange: (styles: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function StyleMultiSelect({
  value,
  onChange,
  disabled = false,
  placeholder = "Select styles...",
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
      <div className="flex flex-wrap gap-1 mb-2">
        {value.map((style) => (
          <StyleBadge
            key={style}
            style={style}
            asLink={false}
            showRemoveButton={!disabled}
            onRemove={() => removeStyle(style)}
          />
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
      <input type="hidden" name="styles" value={JSON.stringify(value)} />
    </div>
  );
}
