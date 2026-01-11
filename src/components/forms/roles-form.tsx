"use client";

import { UseFormSetValue } from "react-hook-form";
import { FormValues } from "./event-form";
import { Role } from "@/types/event";
import { UserSearchItem } from "@/types/user";
import { DebouncedSearchMultiUserSelect } from "../ui/debounced-search-multi-user-select";
import { AVAILABLE_ROLES, RoleTitle } from "@/lib/utils/roles";

interface RolesFormProps {
  setValue: UseFormSetValue<FormValues>;
  roles?: Role[];
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

const generateRoleId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : Math.random().toString(36).substring(2, 9);

export default function RolesForm({ setValue, roles = [] }: RolesFormProps) {
  const getUsersForRole = (title: RoleTitle) =>
    roles
      .filter((role) => role.title === title && role.user)
      .map((role) => role.user as UserSearchItem);

  const handleRoleUsersChange = (
    roleTitle: RoleTitle,
    selectedUsers: UserSearchItem[]
  ) => {
    const existingRolesMap = new Map<string, Role>();

    roles.forEach((role) => {
      if (role.user) {
        const key = `${role.title}-${role.user.username}`;
        if (!existingRolesMap.has(key)) {
          existingRolesMap.set(key, role);
        }
      }
    });

    const buildRoleEntry = (title: RoleTitle, user: UserSearchItem): Role => {
      const key = `${title}-${user.username}`;
      const existing = existingRolesMap.get(key);
      return {
        id:
          existing?.id ?? `role-${title}-${user.username}-${generateRoleId()}`,
        title,
        user,
      };
    };

    const updatedRoles = AVAILABLE_ROLES.flatMap((title) => {
      const usersForTitle =
        title === roleTitle ? selectedUsers : getUsersForRole(title);
      return usersForTitle.map((user) => buildRoleEntry(title, user));
    });

    const otherRoles = roles.filter(
      (role) => !AVAILABLE_ROLES.includes(role.title as RoleTitle)
    );

    setValue("roles", [...updatedRoles, ...otherRoles]);
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto w-full border-2 rounded-sm border-black bg-primary p-5">
      <div className="space-y-4">
        {AVAILABLE_ROLES.map((roleTitle) => (
          <div
            key={roleTitle}
            className="rounded-sm border border-black bg-neutral-200 p-4 space-y-2"
          >
            <DebouncedSearchMultiUserSelect
              label={roleTitle}
              labelColor="text-charcoal"
              name={`roles-${roleTitle}`}
              onSearch={getUserSearchItems}
              placeholder={`Search for ${roleTitle.toLowerCase()}s...`}
              value={getUsersForRole(roleTitle)}
              onChange={(value) => handleRoleUsersChange(roleTitle, value)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
