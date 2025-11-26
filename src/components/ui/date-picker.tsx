"use client";

import * as React from "react";
import { format, parse, isValid } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Control, FieldPath, FieldValues } from "react-hook-form";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface DatePickerProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label?: string;
  disabled?: boolean;
}

export function DatePicker<T extends FieldValues>({
  control,
  name,
  label,
  disabled = false,
}: DatePickerProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        // Convert MM/DD/YYYY string to Date object for the picker
        const parseDateString = (
          dateString: string | undefined | null
        ): Date | undefined => {
          if (!dateString || dateString.trim() === "") {
            return undefined;
          }
          try {
            // Parse MM/DD/YYYY format
            const parsed = parse(dateString, "MM/dd/yyyy", new Date());
            return isValid(parsed) ? parsed : undefined;
          } catch {
            return undefined;
          }
        };

        // Convert Date object to MM/DD/YYYY string for form state
        const formatDateToString = (date: Date | undefined): string => {
          if (!date || !isValid(date)) {
            return "";
          }
          return format(date, "MM/dd/yyyy");
        };

        const dateValue = parseDateString(field.value as string | undefined);

        // Calculate start and end months for year range (1950 to 5 years in the future)
        const currentYear = new Date().getFullYear();
        const startMonth = new Date(1950, 0, 1); // January 1st, 1950
        const endMonth = new Date(currentYear + 5, 11, 31); // December 31st, 5 years from now

        return (
          <FormItem className="w-full">
            {label && <FormLabel>{label}</FormLabel>}
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dateValue && "text-muted-foreground"
                    )}
                    disabled={disabled}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateValue ? (
                      format(dateValue, "MM/dd/yyyy")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  className="rounded-md border shadow-sm"
                  mode="single"
                  selected={dateValue}
                  onSelect={(date) => {
                    // Convert Date to MM/DD/YYYY string and update form
                    field.onChange(formatDateToString(date));
                  }}
                  defaultMonth={dateValue || new Date()}
                  captionLayout="dropdown"
                  startMonth={startMonth}
                  endMonth={endMonth}
                />
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}
