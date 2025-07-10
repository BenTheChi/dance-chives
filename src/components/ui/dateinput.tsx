"use client";

import React, { useState, ChangeEvent } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { z } from "zod";

// This would be your Zod schema in a real implementation
const dateSchema = z
  .string()
  .regex(/^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/, {
    message: "Date must be in MM/DD/YYYY format",
  })
  .refine(
    (date) => {
      if (!date) return true;
      const [month, day, year] = date.split("/").map(Number);
      const dateObj = new Date(year, month - 1, day);
      return (
        dateObj.getFullYear() === year &&
        dateObj.getMonth() === month - 1 &&
        dateObj.getDate() === day
      );
    },
    {
      message: "Invalid date",
    }
  );

const createDateSchema = () => {
  return {
    safeParse: (value: string) => {
      return dateSchema.safeParse(value);
    },
  };
};

interface DateInputProps {
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  onChange?: (value: string) => void;
  value?: string;
  error?: string;
  id?: string;
  name?: string;
}

export default function DateInput({
  placeholder = "MM/DD/YYYY",
  disabled = false,
  className,
  onChange,
  value: propValue,
  error,
  id = "date",
  name = "date",
}: DateInputProps) {
  const [value, setValue] = useState<string>(propValue || "");
  const [validationError, setValidationError] = useState<string>("");
  const dateSchema = createDateSchema();

  // Format the input as MM/DD/YYYY
  const formatDate = (input: string): string => {
    // Remove any non-numeric characters
    const numbersOnly = input.replace(/\D/g, "");
    let formatted = "";

    // Add first slash after MM if at least 2 digits
    if (numbersOnly.length > 0) {
      formatted = numbersOnly.slice(0, 2);

      // Add slash after MM
      if (numbersOnly.length > 2) {
        formatted += "/" + numbersOnly.slice(2, 4);

        // Add slash after DD
        if (numbersOnly.length > 4) {
          formatted += "/" + numbersOnly.slice(4, 8);
        }
      }
    }

    return formatted;
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const rawInput = e.target.value;
    const formattedValue = formatDate(rawInput);
    setValue(formattedValue);

    // Only validate when we have a complete date
    if (formattedValue.length === 10) {
      const result = dateSchema.safeParse(formattedValue);

      if ("success" in result && result.success) {
        setValidationError("");
        if (onChange) {
          onChange(formattedValue);
        }
      } else if ("error" in result && result.error) {
        setValidationError(result.error.message);
      }
    } else {
      setValidationError("");
    }
  };

  return (
    <div className="space-y-2">
      <Input
        id={id}
        name={name}
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "font-mono",
          (error || validationError) &&
            "border-red-500 focus-visible:ring-red-500",
          className
        )}
        maxLength={10}
      />
      {(error || validationError) && (
        <p className="text-sm text-red-500 mt-1">{error || validationError}</p>
      )}
    </div>
  );
}
