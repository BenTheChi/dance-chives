"use client";

import { useState, useTransition, useEffect, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AVAILABLE_ROLES,
  SECTION_ROLE_WINNER,
  SECTION_ROLE_JUDGE,
  VIDEO_ROLE_DANCER,
  VIDEO_ROLE_WINNER,
} from "@/lib/utils/roles";
import {
  tagSelfWithRole,
  tagSelfInSection,
  tagSelfInVideo,
  getPendingTagRequest,
} from "@/lib/server_actions/request_actions";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { CirclePlusButton } from "@/components/ui/circle-plus-button";

interface TagSelfCircleButtonProps {
  eventId: string;
  // For event-level tagging
  currentUserRoles?: string[]; // Roles already assigned to the current user
  isTeamMember?: boolean; // Whether the user is already a team member
  canTagDirectly?: boolean; // Whether the user can tag directly or needs to make a request
  // For section/video-level tagging
  target?: "section" | "video";
  targetId?: string;
  currentUserId?: string;
  role?: string;
  isUserTagged?: boolean;
  showRemoveButton?: boolean;
  pendingLabel?: string;
  successLabel?: string;
  // Custom dialog props
  dialogTitle?: string;
  dialogDescription?: string;
  // For video-level tagging
  videoType?: "battle" | "choreography" | "class";
  currentVideoRoles?: string[]; // Roles user already has in this video
  // Callback to notify parent of pending roles (for display outside component)
  onPendingRolesChange?: (roles: string[]) => void;
  // Button size
  size?: "sm" | "md" | "lg";
  // Default role to pre-select in dialog (for section-level tagging)
  defaultRole?: string;
}

export function TagSelfCircleButton({
  eventId,
  currentUserRoles = [],
  canTagDirectly = false,
  target,
  targetId,
  currentUserId,
  isUserTagged = false,
  pendingLabel,
  successLabel,
  dialogTitle,
  dialogDescription,
  videoType,
  currentVideoRoles = [],
  onPendingRolesChange,
  size = "md",
  defaultRole,
}: TagSelfCircleButtonProps) {
  const { data: session } = useSession();
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const [pendingRoles, setPendingRoles] = useState<Set<string>>(new Set());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter();

  // Ensure currentUserRoles is always an array (memoized to prevent unnecessary re-renders)
  const safeCurrentUserRoles = useMemo(
    () => (Array.isArray(currentUserRoles) ? currentUserRoles : []),
    [currentUserRoles]
  );

  // For section-level tagging, show "Winner" and "Judge" roles
  // For video-level tagging, show roles based on video type
  // For event-level tagging, show all available roles except those already assigned
  const availableRoles = useMemo(() => {
    if (target === "section") {
      // If defaultRole is provided, only show that role (for pre-selected dialogs)
      // Otherwise show both "Winner" and "Judge" roles for sections
      // If user is already tagged, don't show any roles (they can't tag again)
      if (isUserTagged) return [];
      if (defaultRole) {
        return [defaultRole];
      }
      return [SECTION_ROLE_WINNER, SECTION_ROLE_JUDGE];
    }
    if (target === "video") {
      // Video roles based on video type
      const videoRoles: string[] = [];

      // Dancer is available for all video types
      if (!currentVideoRoles.includes(VIDEO_ROLE_DANCER)) {
        videoRoles.push(VIDEO_ROLE_DANCER);
      }

      // Winner is only available for battle videos
      if (
        videoType === "battle" &&
        !currentVideoRoles.includes(VIDEO_ROLE_WINNER)
      ) {
        videoRoles.push(VIDEO_ROLE_WINNER);
      }

      // Choreographer is only available for choreography videos
      if (
        videoType === "choreography" &&
        !currentVideoRoles.includes("Choreographer")
      ) {
        videoRoles.push("Choreographer");
      }

      // Teacher is only available for class videos
      if (videoType === "class" && !currentVideoRoles.includes("Teacher")) {
        videoRoles.push("Teacher");
      }

      return videoRoles;
    }
    // Event-level: filter out roles already assigned
    return AVAILABLE_ROLES.filter(
      (role) => !safeCurrentUserRoles.includes(role)
    );
  }, [
    target,
    isUserTagged,
    safeCurrentUserRoles,
    videoType,
    currentVideoRoles,
    defaultRole,
  ]);

  // Memoize the available roles string for dependency tracking
  const availableRolesString = useMemo(
    () => availableRoles.join(","),
    [availableRoles]
  );

  // Check for pending requests for all available roles in a single GET request
  useEffect(() => {
    const userId = target === "section" ? currentUserId : session?.user?.id;
    if (!userId || availableRoles.length === 0) {
      return;
    }

    let cancelled = false;

    const checkPendingRequests = async () => {
      try {
        // Build query params for single GET request
        const params = new URLSearchParams({
          eventId: eventId,
        });

        if (target === "section" && targetId) {
          params.append("sectionId", targetId);
        }
        if (target === "video" && targetId) {
          params.append("videoId", targetId);
        }

        if (availableRoles.length > 0) {
          params.append("roles", availableRolesString);
        }

        const response = await fetch(
          `/api/tagging-requests/pending?${params.toString()}`
        );

        if (cancelled) return;

        if (!response.ok) {
          throw new Error("Failed to fetch pending requests");
        }

        const { data } = await response.json();
        // Convert object to Set of roles that have pending requests
        const pendingSet = new Set<string>(Object.keys(data || {}));
        setPendingRoles(pendingSet);

        // Notify parent component of pending roles (only if callback exists)
        if (onPendingRolesChange) {
          onPendingRolesChange(Array.from(pendingSet));
        }
      } catch (error) {
        if (cancelled) return;
        console.error("Error checking pending requests:", error);
      }
    };

    checkPendingRequests();

    return () => {
      cancelled = true;
    };
  }, [
    eventId,
    target,
    targetId,
    currentUserId,
    session?.user?.id,
    availableRolesString,
    availableRoles.length,
    onPendingRolesChange,
  ]);

  // Check if user is logged in
  const userId =
    target === "section" || target === "video"
      ? currentUserId
      : session?.user?.id;

  // Filter out roles with pending requests
  const selectableRoles = availableRoles.filter(
    (role) => !pendingRoles.has(role)
  );

  // Auto-select role if only one is available, or if defaultRole is provided
  useEffect(() => {
    if (isDialogOpen && !selectedRole) {
      if (defaultRole && selectableRoles.includes(defaultRole)) {
        setSelectedRole(defaultRole);
      } else if (selectableRoles.length === 1) {
        setSelectedRole(selectableRoles[0]);
      }
    }
  }, [selectableRoles, isDialogOpen, selectedRole, defaultRole]);

  // Reset selected role when dialog closes
  useEffect(() => {
    if (!isDialogOpen) {
      setSelectedRole("");
    }
  }, [isDialogOpen]);

  const handleConfirm = () => {
    // For single-role scenarios, use the auto-selected role
    const roleToUse =
      selectedRole || (selectableRoles.length === 1 ? selectableRoles[0] : "");

    if (!roleToUse) {
      toast.error("Please select a role");
      return;
    }

    startTransition(async () => {
      try {
        let result;
        if (target === "section" && targetId) {
          // Section-level tagging
          result = await tagSelfInSection(eventId, targetId, roleToUse);
        } else if (target === "video" && targetId) {
          // Video-level tagging
          result = await tagSelfInVideo(eventId, targetId, roleToUse);
        } else {
          // Event-level tagging
          result = await tagSelfWithRole(eventId, roleToUse);
        }

        if (result.directTag) {
          toast.success(
            target === "section" && successLabel
              ? successLabel
              : `Successfully tagged yourself as ${roleToUse}`
          );
          setSelectedRole(""); // Reset selection
          setIsDialogOpen(false); // Close dialog
          router.refresh(); // Refresh the page to show the updated roles
        } else {
          toast.success(
            target === "section" && pendingLabel
              ? pendingLabel
              : `Request to tag yourself as ${roleToUse} has been created`
          );
          setSelectedRole(""); // Reset selection
          setIsDialogOpen(false); // Close dialog
          // Refresh to get pending request status
          try {
            const request = await getPendingTagRequest(
              eventId,
              undefined,
              target === "section" ? currentUserId : session?.user?.id,
              target === "section" ? targetId : undefined,
              roleToUse
            );
            if (request) {
              setPendingRoles((prev) => {
                const newSet = new Set(prev).add(roleToUse);
                // Notify parent component of pending roles
                if (onPendingRolesChange) {
                  onPendingRolesChange(Array.from(newSet));
                }
                return newSet;
              });
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
              target === "section" ? currentUserId : session?.user?.id,
              target === "section" ? targetId : undefined,
              roleToUse
            );
            if (request) {
              setPendingRoles((prev) => {
                const newSet = new Set(prev).add(roleToUse);
                // Notify parent component of pending roles
                if (onPendingRolesChange) {
                  onPendingRolesChange(Array.from(newSet));
                }
                return newSet;
              });
              toast.info(`${roleToUse} tag request pending`);
              setIsDialogOpen(false);
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

  // Determine if user can tag directly (for section-level, check canTagDirectly or use session)
  const canTag =
    target === "section"
      ? canTagDirectly !== undefined
        ? canTagDirectly
        : (session?.user?.auth ?? 0) >= 2 // Default to moderator level for sections
      : canTagDirectly;

  const shouldHideButton =
    !userId ||
    (target === "section" && isUserTagged) ||
    availableRoles.length === 0;

  if (shouldHideButton) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      <CirclePlusButton size={size} onClick={() => setIsDialogOpen(true)} />
      {pendingRoles.size > 0 && (
        <div className="flex flex-col gap-2">
          {Array.from(pendingRoles).map((role) => (
            <Badge
              key={role}
              variant="outline"
              className="w-fit bg-gray-200 text-black hover:bg-gray-300"
            >
              {role} tag request pending
            </Badge>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-primary">
          <DialogHeader>
            <DialogTitle>{dialogTitle || "Tag Yourself"}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            {selectableRoles.length > 1 ? (
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Role</label>
                <Select
                  value={selectedRole}
                  onValueChange={setSelectedRole}
                  disabled={isPending}
                >
                  <SelectTrigger className="w-full">
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
              </div>
            ) : selectableRoles.length === 1 ? (
              <div className="text-sm">
                Role: <span className="font-medium">{selectableRoles[0]}</span>
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setSelectedRole("");
              }}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={
                isPending || (selectableRoles.length > 1 && !selectedRole)
              }
            >
              {canTag ? "Confirm" : "Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
