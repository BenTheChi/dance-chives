"use client";

import { Control, FieldPath } from "react-hook-form";
import { Input } from "@/components/ui/input";
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormControl,
} from "@/components/ui/form";
import { FormValues } from "./forms/competition-form";

interface DateInputProps {
  control: Control<FormValues>;
  name: FieldPath<FormValues>;
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
              value={(field.value as string) ?? ""}
              onChange={(e) => {
                const formattedValue = formatDateInput(e.target.value);
                field.onChange(formattedValue);
              }}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
