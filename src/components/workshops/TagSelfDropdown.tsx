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
import { WORKSHOP_ROLES, fromNeo4jRoleFormat } from "@/lib/utils/roles";
import {
  tagSelfWithRoleForWorkshop,
  getPendingTagRequestForWorkshop,
} from "@/lib/server_actions/request_actions";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

interface TagSelfDropdownProps {
  workshopId: string;
  currentUserRoles: string[]; // Roles already assigned to the current user
  isTeamMember?: boolean; // Whether the user is already a team member
}

export function TagSelfDropdown({
  workshopId,
  currentUserRoles,
  isTeamMember = false,
}: TagSelfDropdownProps) {
  const { data: session } = useSession();
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const [pendingRoles, setPendingRoles] = useState<Set<string>>(new Set());
  const router = useRouter();

  // Filter out roles already assigned to the current user
  // Convert WORKSHOP_ROLES to display format for comparison
  // Also filter out "TEAM_MEMBER" if user is already a team member
  const availableRoles = WORKSHOP_ROLES.filter(
    (role) =>
      !currentUserRoles.includes(fromNeo4jRoleFormat(role) || role) &&
      !(role === "TEAM_MEMBER" && isTeamMember)
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
            // Note: Workshop roles are stored in uppercase (e.g., "TEAM_MEMBER")
            const request = await getPendingTagRequestForWorkshop(
              workshopId,
              session.user.id,
              role
            );
            if (request) {
              pendingSet.add(role);
            }
          } catch (error) {
            // Silently handle errors - workshop requests may not be fully supported yet
            console.error(`Error checking pending request for ${role}:`, error);
          }
        })
      );
      setPendingRoles(pendingSet);
    };

    checkPendingRequests();
  }, [workshopId, session?.user?.id, availableRoles.join(",")]);

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
        const result = await tagSelfWithRoleForWorkshop(workshopId, role);

        if (result.directTag) {
          toast.success(
            `Successfully tagged yourself as ${
              fromNeo4jRoleFormat(role) || role
            }`
          );
          setSelectedRole(""); // Reset selection
          router.refresh(); // Refresh the page to show the updated roles
        } else {
          toast.success(
            `Request to tag yourself as ${
              fromNeo4jRoleFormat(role) || role
            } has been created`
          );
          setSelectedRole(""); // Reset selection
          // Refresh to get pending request status
          try {
            const request = await getPendingTagRequestForWorkshop(
              workshopId,
              session?.user?.id,
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
            const request = await getPendingTagRequestForWorkshop(
              workshopId,
              session?.user?.id,
              role
            );
            if (request) {
              setPendingRoles((prev) => new Set(prev).add(role));
              toast.info(
                `${fromNeo4jRoleFormat(role) || role} tag request pending`
              );
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
              {fromNeo4jRoleFormat(role) || role} tag request pending
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
              {fromNeo4jRoleFormat(role) || role}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {pendingRoles.size > 0 && (
        <div className="flex flex-col gap-2">
          {Array.from(pendingRoles).map((role) => (
            <Badge key={role} variant="outline" className="w-fit">
              {fromNeo4jRoleFormat(role) || role} tag request pending
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
