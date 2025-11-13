"use client";

import { Control, UseFormSetValue } from "react-hook-form";
import { WorkshopRole } from "@/types/workshop";
import { Button } from "../ui/button";
import {
  FormControl,
  FormItem,
  FormLabel,
  FormField,
  FormMessage,
} from "../ui/form";
import { MinusIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { UserSearchItem } from "@/types/user";
import { DebouncedSearchSelect } from "../DebouncedSearchSelect";
import { WORKSHOP_ROLES, fromNeo4jRoleFormat } from "@/lib/utils/roles";

interface WorkshopRolesFormProps {
  control: Control<any>;
  setValue: UseFormSetValue<any>;
  roles: WorkshopRole[];
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

export default function WorkshopRolesForm({
  control,
  setValue,
  roles,
}: WorkshopRolesFormProps) {
  // Add a new role entry
  const addRole = () => {
    const newRoleId = Math.random().toString(36).substring(2, 9);
    const newRole: WorkshopRole = {
      id: newRoleId,
      title: "ORGANIZER",
      user: null,
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
    <div className="mb-6">
      {roles.map((role, index) => (
        <div className="flex items-end gap-5 mb-4" key={role.id}>
          {/* Remove role button */}
          <Button
            onClick={() => removeRole(role.id)}
            variant="outline"
            size="icon"
            className="rounded-full hover:bg-red-200"
            type="button"
          >
            <MinusIcon />
          </Button>

          {/* Side-by-side form fields */}
          <div className="flex gap-5 w-full">
            <FormField
              control={control}
              name={`roles.${index}.title`}
              render={() => (
                <FormItem className="w-full">
                  <FormLabel>Role</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={(value) => {
                        setValue(`roles.${index}.title`, value);
                      }}
                      value={roles[index].title}
                    >
                      <SelectTrigger className="bg-white w-full">
                        <SelectValue placeholder="Select Role">
                          {roles[index].title
                            ? fromNeo4jRoleFormat(roles[index].title) ||
                              roles[index].title
                            : "Select Role"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {WORKSHOP_ROLES.map((role) => (
                          <SelectItem key={role} value={role}>
                            {fromNeo4jRoleFormat(role) || role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DebouncedSearchSelect<UserSearchItem>
              control={control}
              name={`roles.${index}.user`}
              onSearch={getUserSearchItems}
              placeholder="Search..."
              getDisplayValue={(item: UserSearchItem) => {
                if (!item.displayName || !item.username) return "";
                return `${item.displayName} (${item.username})`;
              }}
              getItemId={(item) => item.username}
              onChange={(value) => {
                setValue(`roles.${index}.user`, value as UserSearchItem | null);
              }}
              value={roles[index].user}
              label="User"
            />
          </div>
        </div>
      ))}

      <Button
        className="border-2 px-4 py-2 rounded-lg hover:bg-[#B4D4F7] mt-5"
        onClick={addRole}
        type="button"
      >
        + Add Another Role
      </Button>
    </div>
  );
}
