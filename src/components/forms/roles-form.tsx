"use client";

import { Control, UseFormSetValue } from "react-hook-form";
import { FormValues } from "./event-form";
import { Role } from "@/types/event";
import { Button } from "../ui/button";
import {
  FormControl,
  FormItem,
  FormLabel,
  FormField,
  FormMessage,
} from "../ui/form"; // form components
import { X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { UserSearchItem } from "@/types/user";
import { DebouncedSearchSelect } from "../DebouncedSearchSelect";
import { AVAILABLE_ROLES } from "@/lib/utils/roles";
import { CirclePlusButton } from "../ui/circle-plus-button";

interface RolesFormProps {
  control: Control<FormValues>;
  setValue: UseFormSetValue<FormValues>;
  roles: Role[];
}

async function getUserSearchItems(keyword: string): Promise<UserSearchItem[]> {
  return fetch(`${process.env.NEXT_PUBLIC_ORIGIN}/api/users?keyword=${keyword}`)
    .then((response) => {
      if (!response.ok) {
        console.error("Failed to fetch users", response.statusText);
        return [];
      }
      return response.json();
    })
    .then((data) => {
      return data.data;
    })
    .catch((error) => {
      console.error(error);
      return [];
    });
}

// This component is used to render the roles form in the event creation process.
export default function RolesForm({
  control,
  setValue,
  roles,
}: RolesFormProps) {
  // Add a new role entry
  const addRole = () => {
    const newRoleId = Math.random().toString(36).substring(2, 9);
    const newRole = {
      id: newRoleId,
      title: "",
      user: {
        id: "",
        displayName: "",
        username: "",
      },
    };

    // Add to our local state array
    setValue("roles", [...roles, newRole]);
  };

  // Remove a role entry
  const removeRole = (idToRemove: string) => {
    setValue(
      "roles",
      roles.filter((r) => r.id !== idToRemove)
    );
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full border rounded-md border-border bg-misty-seafoam">
      {roles.length === 0 ? (
        <div className="p-6 text-center">
          <div className="text-sm text-muted-foreground mb-6">
            No roles yet. Let&apos;s create one!
          </div>
          <div className="flex justify-center">
            <CirclePlusButton size="lg" onClick={addRole} />
          </div>
        </div>
      ) : (
        <div className="space-y-2 py-5">
          {roles.map((role, index) => (
            <div key={role.id}>
              <div className="px-5 py-2">
                <div className="flex items-end gap-4">
                  <FormField
                    control={control}
                    name={`roles.${index}.title`}
                    render={() => (
                      <FormItem className="flex-1">
                        <FormLabel>Role</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={(value) => {
                              setValue(`roles.${index}.title`, value);
                            }}
                            value={roles[index].title}
                          >
                            <SelectTrigger className="bg-white w-full">
                              <SelectValue placeholder="Select Role" />
                            </SelectTrigger>
                            <SelectContent>
                              {AVAILABLE_ROLES.map((role) => (
                                <SelectItem key={role} value={role}>
                                  {role}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex-1">
                    <DebouncedSearchSelect<UserSearchItem, FormValues>
                      control={control as Control<FormValues>}
                      name={`roles.${index}.user`}
                      onSearch={getUserSearchItems}
                      placeholder="Search..."
                      getDisplayValue={(item: UserSearchItem) => {
                        if (!item.displayName || !item.username) return "";
                        return `${item.displayName} (${item.username})`;
                      }}
                      getItemId={(item) => item.username}
                      onChange={(value) => {
                        setValue(
                          `roles.${index}.user`,
                          value as UserSearchItem
                        );
                      }}
                      value={roles[index].user}
                      label="User"
                    />
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeRole(role.id)}
                    className="h-6 w-6 rounded-full p-0 text-destructive hover:text-destructive bg-transparent hover:bg-destructive/10 mb-1"
                    aria-label={`Remove role ${index + 1}`}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}

          <div className="flex justify-center mt-6">
            <CirclePlusButton size="lg" onClick={addRole} />
          </div>
        </div>
      )}
    </div>
  );
}
