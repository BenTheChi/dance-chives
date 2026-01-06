"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UserAvatar } from "@/components/ui/user-avatar";
import { fromNeo4jRoleFormat } from "@/lib/utils/roles";
import { removeRoleFromEvent } from "@/lib/server_actions/request_actions";
import { Role } from "@/types/event";
import { EventTagSelfButton } from "./event-client";

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
                  currentUserId &&
                  roleUserId &&
                  (currentUserId === roleUserId ||
                    currentUserId === role.user?.id ||
                    currentUserId === role.user?.username);

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
                    onRemove={() =>
                      roleUserId && handleRemoveRole(roleUserId, roleTitle)
                    }
                    isRemoving={isPending}
                  />
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
