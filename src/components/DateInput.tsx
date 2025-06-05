"use client";

import { useState } from "react";
import { Control, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormControl,
} from "@/components/ui/form";

interface DateInputProps {
  control: Control<any>;
  name: string;
  label?: string;
}

export default function DateInput({ control, name, label }: DateInputProps) {
  // Function to format date input as MM/DD/YYYY
  const formatDateInput = (value: string) => {
    // Remove all non-numeric characters
    const numericValue = value.replace(/\D/g, "");

    // Apply MM/DD/YYYY formatting
    if (numericValue.length <= 2) {
      return numericValue;
    } else if (numericValue.length <= 4) {
      return `${numericValue.slice(0, 2)}/${numericValue.slice(2)}`;
    } else {
      return `${numericValue.slice(0, 2)}/${numericValue.slice(
        2,
        4
      )}/${numericValue.slice(4, 8)}`;
    }
  };

  // Store the current formatted value for display
  const [currentValue, setCurrentValue] = useState("");

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="w-full">
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              placeholder="MM/DD/YYYY"
              maxLength={10}
              className="font-mono"
              {...field}
              onChange={(e) => {
                const formattedValue = formatDateInput(e.target.value);
                field.onChange(formattedValue);
                setCurrentValue(formattedValue);
              }}
            />
          </FormControl>
          <p className="text-sm text-muted-foreground">
            Enter date in MM/DD/YYYY format
          </p>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
