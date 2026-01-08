import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-bold placeholder:text-charcoal selection:bg-primary selection:text-primary-foreground bg-neutral-300 text-black border-input flex h-9 w-full min-w-0 rounded-sm border px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "[&::file-selector-button]:border-r [&::file-selector-button]:border-charcoal [&::file-selector-button]:mr-2 [&::file-selector-button]:pr-2",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  );
}

function InstagramInput({
  className,
  onChange,
  value,
  ...props
}: React.ComponentProps<"input">) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove @ symbols and only allow Instagram handle characters: letters, numbers, underscores, periods
    let filteredValue = e.target.value
      .replace(/@/g, "") // Remove any @ symbols
      .replace(/[^a-zA-Z0-9_.]/g, ""); // Only allow letters, numbers, underscores, and periods

    // Enforce 30 character limit
    if (filteredValue.length > 30) {
      filteredValue = filteredValue.slice(0, 30);
    }

    // Create a synthetic event with the filtered value
    const syntheticEvent = {
      ...e,
      target: {
        ...e.target,
        value: filteredValue,
      },
    } as React.ChangeEvent<HTMLInputElement>;

    onChange?.(syntheticEvent);
  };

  return (
    <div className="relative flex items-center w-full">
      <span className="absolute left-1 text-black pointer-events-none select-none z-10">
        @
      </span>
      <input
        type="text"
        data-slot="input"
        className={cn(
          "file:text-bold placeholder:text-charcoal selection:bg-primary selection:text-primary-foreground bg-neutral-300 text-black border-input flex h-9 w-full min-w-0 rounded-sm border pl-6 pr-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          "[&::file-selector-button]:border-r [&::file-selector-button]:border-charcoal [&::file-selector-button]:mr-2 [&::file-selector-button]:pr-2",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
          "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
          className
        )}
        onChange={handleChange}
        value={value ?? ""}
        maxLength={30}
        {...props}
      />
    </div>
  );
}

export { Input, InstagramInput };
