"use client";

import { useState, useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AVAILABLE_ROLES } from "@/lib/utils/roles";
import { tagSelfWithRole } from "@/lib/server_actions/request_actions";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

interface TagSelfDropdownProps {
  eventId: string;
  currentUserRoles: string[]; // Roles already assigned to the current user
}

export function TagSelfDropdown({
  eventId,
  currentUserRoles,
}: TagSelfDropdownProps) {
  const { data: session } = useSession();
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Filter out roles already assigned to the current user
  const availableRoles = AVAILABLE_ROLES.filter(
    (role) => !currentUserRoles.includes(role)
  );

  // Don't show the dropdown if user is not logged in or all roles are taken
  if (!session?.user?.id || availableRoles.length === 0) {
    return null;
  }

  const handleRoleSelect = (role: string) => {
    if (!role) return;

    startTransition(async () => {
      try {
        const result = await tagSelfWithRole(eventId, role);
        if (result.directTag) {
          toast.success(`Successfully tagged yourself as ${role}`);
          setSelectedRole(""); // Reset selection
          router.refresh(); // Refresh the page to show the updated roles
        } else {
          toast.success(`Request to tag yourself as ${role} has been created`);
          setSelectedRole(""); // Reset selection
          // Don't refresh page for requests since tag isn't applied yet
        }
      } catch (error) {
        console.error("Error tagging self:", error);
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to tag yourself. Please try again."
        );
      }
    });
  };

  return (
    <div className="flex flex-col gap-2 mb-2">
      <label className="text-sm font-semibold">Tag Self:</label>
      <Select
        value={selectedRole}
        onValueChange={handleRoleSelect}
        disabled={isPending}
      >
        <SelectTrigger className="w-full bg-white">
          <SelectValue placeholder="Select a role" />
        </SelectTrigger>
        <SelectContent>
          {availableRoles.map((role) => (
            <SelectItem key={role} value={role}>
              {role}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
