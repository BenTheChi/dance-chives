"use client";

import { useEffect, useMemo, useState, useTransition, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CirclePlusButton } from "@/components/ui/circle-plus-button";
import { DebouncedSearchMultiUserSelect } from "@/components/ui/debounced-search-multi-user-select";
import {
  AVAILABLE_ROLES,
  SECTION_ROLE_JUDGE,
  SECTION_ROLE_WINNER,
  VIDEO_ROLE_DANCER,
  VIDEO_ROLE_WINNER,
} from "@/lib/utils/roles";
import { UserSearchItem } from "@/types/user";

interface TagUserCircleButtonProps {
  eventId: string;
  target?: "section" | "video";
  targetId?: string;
  currentUserRoles?: string[];
  currentVideoRoles?: string[];
  videoType?: "battle" | "choreography" | "class" | "other";
  isUserTagged?: boolean;
  size?: "sm" | "md" | "lg";
  dialogTitle?: string;
  defaultRole?: string;
  existingTaggedUsers?: UserSearchItem[];
  onUsersTagged?: (users: UserSearchItem[], role: string) => void;
}

async function searchUsers(keyword: string): Promise<UserSearchItem[]> {
  const res = await fetch(`/api/users?keyword=${encodeURIComponent(keyword)}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data?.data || [];
}

async function createUnclaimed(displayName: string, instagram: string) {
  const res = await fetch("/api/unclaimed-users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ displayName, instagram }),
  });
  const data = await res.json();
  if (!res.ok || !data?.success) {
    throw new Error(data?.error || "Failed to create account");
  }
  return data.user as UserSearchItem;
}

async function tagUsersApi(input: {
  eventId: string;
  role: string;
  userIds: string[];
  videoId?: string;
  sectionId?: string;
}) {
  const res = await fetch("/api/tag-users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await res.json();
  if (!res.ok || !data?.success) {
    throw new Error(data?.error || "Failed to tag users");
  }
  return data as {
    success: boolean;
    tagged: string[];
    failed: Array<{ userId: string; error: string }>;
  };
}

export function TagUserCircleButton(props: TagUserCircleButtonProps) {
  // Backward-compatible export name
  const {
    eventId,
    target,
    targetId,
    currentUserRoles = [],
    currentVideoRoles = [],
    videoType,
    isUserTagged = false,
    size = "md",
    dialogTitle,
    defaultRole,
    existingTaggedUsers = [],
    onUsersTagged,
  } = props;

  const { data: session, status } = useSession();
  const router = useRouter();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | undefined>(
    undefined
  );
  const [selectedUsers, setSelectedUsers] = useState<UserSearchItem[]>([]);
  const [isPending, startTransition] = useTransition();
  const previousDialogState = useRef(false);

  const availableRoles = useMemo(() => {
    if (target === "section") {
      if (isUserTagged) return [];
      if (defaultRole) return [defaultRole];
      return [SECTION_ROLE_WINNER, SECTION_ROLE_JUDGE];
    }
    if (target === "video") {
      const roles: string[] = [];
      if (!currentVideoRoles.includes(VIDEO_ROLE_DANCER)) {
        roles.push(VIDEO_ROLE_DANCER);
      }
      if (
        (videoType === "battle" || videoType === "other") &&
        !currentVideoRoles.includes(VIDEO_ROLE_WINNER)
      ) {
        roles.push(VIDEO_ROLE_WINNER);
      }
      if (
        (videoType === "choreography" || videoType === "other") &&
        !currentVideoRoles.includes("Choreographer")
      ) {
        roles.push("Choreographer");
      }
      if (
        (videoType === "class" || videoType === "other") &&
        !currentVideoRoles.includes("Teacher")
      ) {
        roles.push("Teacher");
      }
      return roles;
    }
    return AVAILABLE_ROLES.filter((r) => !currentUserRoles.includes(r));
  }, [
    target,
    isUserTagged,
    defaultRole,
    videoType,
    currentVideoRoles,
    currentUserRoles,
  ]);

  // Reset state when dialog closes
  useEffect(() => {
    if (previousDialogState.current && !isDialogOpen) {
      // Dialog just closed, reset state
      setSelectedRole(undefined);
      setSelectedUsers([...existingTaggedUsers]);
    }
    previousDialogState.current = isDialogOpen;
  }, [isDialogOpen, existingTaggedUsers]);

  // Set default role when dialog opens
  useEffect(() => {
    if (isDialogOpen && !selectedRole) {
      if (defaultRole && availableRoles.includes(defaultRole)) {
        setSelectedRole(defaultRole);
      } else if (availableRoles.length === 1) {
        setSelectedRole(availableRoles[0]);
      }
    }
  }, [isDialogOpen, defaultRole, availableRoles, selectedRole]);

  const handleTagSelf = () => {
    if (!session?.user?.id) return;
    const username =
      (session.user as any).username ||
      session.user.email?.split("@")[0] ||
      session.user.id;
    const displayName =
      (session.user as any).displayName ||
      session.user.name ||
      username ||
      "Me";
    const user: UserSearchItem = {
      id: session.user.id,
      username,
      displayName,
      instagram: (session.user as any).instagram || null,
      claimed: true,
      avatar: (session.user as any).avatar || session.user.image || null,
      image: session.user.image || null,
    };
    const exists = selectedUsers.some(
      (u) => (u.id && u.id === user.id) || u.username === user.username
    );
    if (!exists) {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const handleConfirm = () => {
    const roleToUse =
      selectedRole ||
      (availableRoles.length === 1 ? availableRoles[0] : undefined);
    if (!roleToUse) {
      toast.error("Please select a role");
      return;
    }
    const userIds = selectedUsers.map((u) => u.id).filter(Boolean) as string[];
    if (userIds.length === 0) {
      toast.error("Select at least one user");
      return;
    }

    // Optimistically update UI before API call
    if (onUsersTagged) {
      onUsersTagged(selectedUsers, roleToUse);
    }

    startTransition(async () => {
      try {
        const result = await tagUsersApi({
          eventId,
          role: roleToUse,
          userIds,
          videoId: target === "video" ? targetId : undefined,
          sectionId: target === "section" ? targetId : undefined,
        });
        if (result.failed.length === 0) {
          toast.success("Users tagged");
        } else if (result.tagged.length > 0) {
          toast.error(
            `Tagged ${result.tagged.length}, failed ${result.failed.length}`
          );
        } else {
          toast.error("Failed to tag users");
        }
        setIsDialogOpen(false);
        setSelectedRole(undefined);
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to tag users"
        );
        // On error, we could revert the optimistic update, but router.refresh() will handle it
      }
    });
  };

  // Only show button if user is logged in
  const isLoggedIn = status === "authenticated" && session?.user?.id;
  const shouldHideButton = !isLoggedIn || availableRoles.length === 0;

  if (shouldHideButton) return null;

  return (
    <div className="flex flex-col gap-2">
      <CirclePlusButton
        size={size}
        onClick={(e) => {
          e.stopPropagation();
          setIsDialogOpen(true);
        }}
      />
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-primary">
          <DialogHeader>
            <DialogTitle>{dialogTitle || "Tag People"}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Role</label>
              <Select
                value={selectedRole || undefined}
                onValueChange={setSelectedRole}
                disabled={availableRoles.length === 0}
              >
                <SelectTrigger className="w-full">
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

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">People</label>
              <DebouncedSearchMultiUserSelect
                onSearch={searchUsers}
                onChange={setSelectedUsers}
                value={selectedUsers}
                preexistingUsers={existingTaggedUsers}
                name="tag-users"
                placeholder="Search by name, username, or Instagram..."
                context={{
                  role: selectedRole,
                  eventId,
                  sectionId: target === "section" ? targetId : undefined,
                  videoId: target === "video" ? targetId : undefined,
                }}
                onCreateUnclaimedUser={createUnclaimed}
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleTagSelf}>
                Tag Self
              </Button>
              <div className="flex-1" />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setSelectedRole(undefined);
              }}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={isPending}>
              {isPending ? "Tagging..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
