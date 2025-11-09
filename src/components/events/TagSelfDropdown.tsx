"use client";

import { useState, useTransition, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AVAILABLE_ROLES } from "@/lib/utils/roles";
import {
  tagSelfWithRole,
  getPendingTagRequest,
} from "@/lib/server_actions/request_actions";
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
  const [pendingRoles, setPendingRoles] = useState<Set<string>>(new Set());
  const router = useRouter();

  // Filter out roles already assigned to the current user
  const availableRoles = AVAILABLE_ROLES.filter(
    (role) => !currentUserRoles.includes(role)
  );

  // Check for pending requests for each available role
  useEffect(() => {
    if (!session?.user?.id || availableRoles.length === 0) {
      return;
    }

    const checkPendingRequests = async () => {
      const pendingSet = new Set<string>();
      await Promise.all(
        availableRoles.map(async (role) => {
          try {
            // Note: Role is stored in database as-is (e.g., "Organizer", not "ORGANIZER"), so we search for it as-is
            const request = await getPendingTagRequest(
              eventId,
              undefined,
              session.user.id,
              undefined,
              role
            );
            if (request) {
              pendingSet.add(role);
            }
          } catch (error) {
            console.error(`Error checking pending request for ${role}:`, error);
          }
        })
      );
      setPendingRoles(pendingSet);
    };

    checkPendingRequests();
  }, [eventId, session?.user?.id, availableRoles.join(",")]);

  // Don't show the dropdown if user is not logged in or all roles are taken
  if (!session?.user?.id || availableRoles.length === 0) {
    return null;
  }

  // Filter out roles with pending requests
  const selectableRoles = availableRoles.filter(
    (role) => !pendingRoles.has(role)
  );

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
          // Refresh to get pending request status
          try {
            const request = await getPendingTagRequest(
              eventId,
              undefined,
              session?.user?.id,
              undefined,
              role
            );
            if (request) {
              setPendingRoles((prev) => new Set(prev).add(role));
            }
          } catch (fetchError) {
            console.error("Error fetching pending request:", fetchError);
            // Don't show error for this - it's not critical
          }
        }
      } catch (error) {
        console.error("Error tagging self:", error);
        // If error is about existing request, check for pending request
        if (
          error instanceof Error &&
          error.message.includes("already exists")
        ) {
          try {
            const request = await getPendingTagRequest(
              eventId,
              undefined,
              session?.user?.id,
              undefined,
              role
            );
            if (request) {
              setPendingRoles((prev) => new Set(prev).add(role));
              toast.info(`${role} tag request pending`);
              return;
            }
          } catch (fetchError) {
            console.error("Error fetching pending request:", fetchError);
          }
        }
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to tag yourself. Please try again."
        );
      }
    });
  };

  // If all roles have pending requests, show messages instead of dropdown
  if (selectableRoles.length === 0 && pendingRoles.size > 0) {
    return (
      <div className="flex flex-col gap-2 mb-2">
        <label className="text-sm font-semibold">Tag Self:</label>
        <div className="flex flex-col gap-2">
          {Array.from(pendingRoles).map((role) => (
            <Badge key={role} variant="outline" className="w-fit">
              {role} tag request pending
            </Badge>
          ))}
        </div>
      </div>
    );
  }

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
          {selectableRoles.map((role) => (
            <SelectItem key={role} value={role}>
              {role}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {pendingRoles.size > 0 && (
        <div className="flex flex-col gap-2">
          {Array.from(pendingRoles).map((role) => (
            <Badge key={role} variant="outline" className="w-fit">
              {role} tag request pending
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
