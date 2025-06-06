"use client";

import { Control, UseFormSetValue } from "react-hook-form";
import { FormValues } from "./event-form";
import { Role } from "@/types/event";
import { Button } from "../ui/button";
import { FormControl, FormItem, FormLabel, FormField } from "../ui/form";
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

// Define the available roles for the event
const availableRoles = [
  "Organizer",
  "DJ",
  "Photographer",
  "Videographer",
  "Designer",
  "MC",
];

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
              render={({ field }) => (
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
                        <SelectValue placeholder="Select Role" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableRoles.map((role) => (
                          <SelectItem key={role} value={role}>
                            {role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
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
              getItemId={(item) => item.id}
              onChange={(value) => {
                setValue(`roles.${index}.user`, value);
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
