"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserAvatar } from "@/components/ui/user-avatar";
import { fromNeo4jRoleFormat } from "@/lib/utils/roles";
import { removeRoleFromEvent } from "@/lib/server_actions/request_actions";
import { getEventAuthData } from "@/lib/server_actions/event_actions";
import { Role } from "@/types/event";
import { EventTagSelfButton } from "./event-client";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

interface EventRolesProps {
  eventId: string;
  rolesByTitle: Map<string, Role[]>;
  currentUserId?: string;
}

export function EventRoles({
  eventId,
  rolesByTitle,
  currentUserId,
}: EventRolesProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [canManageRoles, setCanManageRoles] = useState(false);
  const [pendingRemoval, setPendingRemoval] = useState<{
    userId: string;
    roleTitle: string;
    displayName: string;
  } | null>(null);

  // Determine whether current user can remove any roles (creator, team, moderator/admin).
  useEffect(() => {
    let cancelled = false;
    const loadAuth = async () => {
      try {
        const result = await getEventAuthData(eventId);
        if (cancelled) return;
        const authData = result.data;
        if (authData) {
          const canEditRoles =
            authData.canEdit ||
            authData.isModeratorOrAdmin ||
            authData.isTeamMember ||
            authData.isCreator;
          setCanManageRoles(!!canEditRoles);
        }
      } catch (error) {
        if (cancelled) return;
        console.error("Failed to fetch event auth data:", error);
      }
    };
    loadAuth();
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const handleRemoveRole = (userId: string, roleTitle: string) => {
    if (!currentUserId) return;

    // Convert Neo4j role format to display format for the server action
    const displayRole = fromNeo4jRoleFormat(roleTitle) || roleTitle;

    startTransition(async () => {
      try {
        await removeRoleFromEvent(eventId, userId, displayRole);
        toast.success("Role removed successfully");
        router.refresh();
      } catch (error) {
        console.error("Error removing role:", error);
        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to remove role. Please try again."
        );
      }
    });
  };

  return (
    <div className="w-full sm:flex-1 bg-primary-dark rounded-sm border-2 border-primary-light p-4">
      <div className="flex gap-2 justify-center items-center mb-4">
        <h2 className="text-center underline">Roles</h2>
        <EventTagSelfButton eventId={eventId} />
      </div>
      {Array.from(rolesByTitle.entries()).map(([roleTitle, roles]) => (
        <div key={roleTitle} className="flex flex-col gap-1">
          <div
            key={roleTitle}
            className="flex flex-row flex-wrap gap-2 items-center"
          >
            <h3>{fromNeo4jRoleFormat(roleTitle) || roleTitle}</h3>

            <div className="flex flex-row gap-2 items-center flex-wrap">
              {roles.map((role, index) => {
                const roleUserId = role.user?.id || role.user?.username;
                const canRemove =
                  !!currentUserId &&
                  !!roleUserId &&
                  (currentUserId === roleUserId || canManageRoles);

                return (
                  <UserAvatar
                    key={`${role.id}-${index}`}
                    username={role.user?.username ?? ""}
                    displayName={
                      role.user?.displayName ?? role.user?.username ?? ""
                    }
                    avatar={(role.user as { avatar?: string | null }).avatar}
                    image={(role.user as { image?: string | null }).image}
                    showHoverCard
                    city={(role.user as { city?: string }).city || ""}
                    styles={(role.user as { styles?: string[] }).styles}
                    isSmall={true}
                    showRemoveButton={canRemove || false}
                    onRemove={() => {
                      if (!roleUserId) return;
                      const displayName =
                        role.user?.displayName ||
                        role.user?.username ||
                        "this role";
                      setPendingRemoval({
                        userId: roleUserId,
                        roleTitle,
                        displayName,
                      });
                    }}
                    isRemoving={isPending}
                  />
                );
              })}
            </div>
          </div>
        </div>
      ))}
      <ConfirmationDialog
        open={Boolean(pendingRemoval)}
        title="Remove role"
        description={`Remove ${pendingRemoval?.displayName || "this role"}?`}
        confirmLabel="Remove"
        cancelLabel="Cancel"
        loading={isPending}
        onCancel={() => setPendingRemoval(null)}
        onConfirm={() => {
          if (!pendingRemoval) return;
          handleRemoveRole(pendingRemoval.userId, pendingRemoval.roleTitle);
          setPendingRemoval(null);
        }}
      />
    </div>
  );
}
