"use client";

import { Button } from "@/components/ui/button";
import {
  approveTaggingRequest,
  denyTaggingRequest,
  approveTeamMemberRequest,
  denyTeamMemberRequest,
  approveOwnershipRequest,
  denyOwnershipRequest,
  approveAuthLevelChangeRequest,
  denyAuthLevelChangeRequest,
  cancelTaggingRequest,
  cancelTeamMemberRequest,
  cancelOwnershipRequest,
  cancelAuthLevelChangeRequest,
} from "@/lib/server_actions/request_actions";
import { toast } from "sonner";
import { useState } from "react";
import { formatRelativeDate } from "@/lib/utils/relative-date";
import { generateRequestBreadcrumbs } from "@/lib/utils/request-utils-client";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { UserAvatar } from "@/components/ui/user-avatar";
import { OwnershipApprovalDialog } from "./OwnershipApprovalDialog";

interface RequestCardProps {
  request: {
    id: string;
    type: string;
    sender?: {
      id?: string;
      name?: string | null;
      email: string;
      displayName?: string | null;
      username?: string | null;
      avatar?: string | null;
      image?: string | null;
      city?: string | null;
      styles?: string[];
    };
    targetUser?: {
      id?: string;
      name?: string | null;
      email: string;
      displayName?: string | null;
      username?: string | null;
      avatar?: string | null;
      image?: string | null;
      city?: string | null;
      styles?: string[];
    };
    eventId?: string | null;
    eventTitle?: string | null;
    eventType?: string | null;
    videoId?: string | null;
    videoTitle?: string | null;
    sectionId?: string | null;
    sectionTitle?: string | null;
    role?: string;
    status: string;
    createdAt: Date;
    updatedAt?: Date;
    requestedLevel?: number;
    currentLevel?: number;
    message?: string;
  };
  onRequestUpdated?: (requestId: string, newStatus: string) => void;
}

// Request type to action handler mapping
const APPROVE_HANDLERS: Record<
  string,
  (id: string, ...args: any[]) => Promise<unknown>
> = {
  TAGGING: approveTaggingRequest,
  TEAM_MEMBER: approveTeamMemberRequest,
  OWNERSHIP: approveOwnershipRequest,
  AUTH_LEVEL_CHANGE: approveAuthLevelChangeRequest,
};

const DENY_HANDLERS: Record<
  string,
  (id: string, ...args: any[]) => Promise<unknown>
> = {
  TAGGING: denyTaggingRequest,
  TEAM_MEMBER: denyTeamMemberRequest,
  OWNERSHIP: denyOwnershipRequest,
  AUTH_LEVEL_CHANGE: denyAuthLevelChangeRequest,
};

const CANCEL_HANDLERS: Record<string, (id: string) => Promise<unknown>> = {
  TAGGING: cancelTaggingRequest,
  TEAM_MEMBER: cancelTeamMemberRequest,
  OWNERSHIP: cancelOwnershipRequest,
  AUTH_LEVEL_CHANGE: cancelAuthLevelChangeRequest,
};

/**
 * Gets the color class for request status
 */
function getStatusColor(status: string): string {
  switch (status) {
    case "APPROVED":
      return "text-green-600";
    case "DENIED":
      return "text-red-600";
    case "PENDING":
      return "text-yellow-600";
    case "CANCELLED":
      return "text-gray-600";
    default:
      return "text-muted-foreground";
  }
}

/**
 * Gets the resource name for the request (Event/Section/Video)
 */
function getResourceName(request: RequestCardProps["request"]): string {
  if (request.videoTitle) return request.videoTitle;
  if (request.sectionTitle) return request.sectionTitle;
  if (request.eventTitle) return request.eventTitle;
  return "Unknown";
}

/**
 * Gets the resource link for the request
 */
function getResourceLink(request: RequestCardProps["request"]): string {
  if (request.videoId && request.sectionId && request.eventId) {
    return `/events/${request.eventId}/sections/${request.sectionId}?video=${request.videoId}`;
  }
  if (request.sectionId && request.eventId) {
    return `/events/${request.eventId}/sections/${request.sectionId}`;
  }
  if (request.eventId) {
    return `/events/${request.eventId}`;
  }
  return "#";
}

export function IncomingRequestCard({
  request,
  onRequestUpdated,
}: RequestCardProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [localStatus, setLocalStatus] = useState(request.status);
  const [showOwnershipDialog, setShowOwnershipDialog] = useState(false);

  /**
   * Generic handler for approve/deny actions
   */
  const handleAction = async (
    action: "approve" | "deny",
    addOldCreatorAsTeamMember?: boolean
  ) => {
    setIsProcessing(true);
    try {
      const handler =
        action === "approve"
          ? APPROVE_HANDLERS[request.type]
          : DENY_HANDLERS[request.type];

      if (!handler) {
        throw new Error("Unknown request type");
      }

      // For ownership requests, pass the addOldCreatorAsTeamMember parameter
      if (request.type === "OWNERSHIP" && action === "approve") {
        await handler(request.id, addOldCreatorAsTeamMember ?? false);
      } else {
        await handler(request.id);
      }

      const newStatus = action === "approve" ? "APPROVED" : "DENIED";
      setLocalStatus(newStatus);
      toast.success(`Request ${action === "approve" ? "approved" : "denied"}`);

      // Notify parent component to update its state
      if (onRequestUpdated) {
        onRequestUpdated(request.id, newStatus);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : `Failed to ${action} request`
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApproveClick = () => {
    if (request.type === "OWNERSHIP") {
      setShowOwnershipDialog(true);
    } else {
      handleAction("approve");
    }
  };

  const breadcrumbs = generateRequestBreadcrumbs(request);
  const senderName =
    request.sender?.displayName ||
    request.sender?.name ||
    request.sender?.email ||
    "Unknown";
  const senderUsername = request.sender?.username || "";
  const resourceName = getResourceName(request);
  const resourceLink = getResourceLink(request);

  return (
    <article className="border-2 rounded-lg p-4 bg-secondary-dark">
      <div className="space-y-3">
        {/* Date - top left, muted, smaller text */}
        <time
          className="text-xs block"
          dateTime={request.createdAt.toISOString()}
        >
          {formatRelativeDate(new Date(request.createdAt))}
        </time>

        {/* Message: Avatar + Display Name requested Role Name from Link */}
        <div className="flex items-center gap-2 text-sm">
          {request.sender && (
            <UserAvatar
              username={senderUsername || request.sender.email}
              displayName={senderName}
              avatar={request.sender.avatar}
              image={request.sender.image}
              city={request.sender.city || ""}
              styles={request.sender.styles}
              isSmall={true}
              showHoverCard={true}
            />
          )}
          <p>
            <strong>{senderName}</strong> requested{" "}
            {request.type === "OWNERSHIP" ? (
              <>
                <strong>ownership</strong> of{" "}
              </>
            ) : (
              <>{request.role && <strong>{request.role}</strong>} from </>
            )}
            <Link
              href={resourceLink}
              className="text-primary-light hover:text-primary-light hover:underline"
            >
              {resourceName}
            </Link>
          </p>
        </div>

        {/* Breadcrumb trail */}
        {breadcrumbs.length > 0 && (
          <nav
            className="flex items-center gap-1 text-xs"
            aria-label="Breadcrumb"
          >
            {breadcrumbs.map((crumb, index) => (
              <div key={crumb.href} className="flex items-center gap-1">
                <Link
                  href={crumb.href}
                  className="hover:text-primary-light hover:underline"
                >
                  {crumb.label}
                </Link>
                {index < breadcrumbs.length - 1 && (
                  <ChevronRight className="h-3 w-3" aria-hidden="true" />
                )}
              </div>
            ))}
          </nav>
        )}

        {/* Approve/Deny buttons */}
        {localStatus === "PENDING" && (
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleApproveClick}
              disabled={isProcessing}
              variant="default"
              size="sm"
            >
              Approve
            </Button>
            <Button
              onClick={() => handleAction("deny")}
              disabled={isProcessing}
              variant="destructive"
              size="sm"
            >
              Deny
            </Button>
          </div>
        )}
      </div>

      {/* Ownership approval dialog */}
      {request.type === "OWNERSHIP" && (
        <OwnershipApprovalDialog
          open={showOwnershipDialog}
          onOpenChange={setShowOwnershipDialog}
          onApprove={(addOldCreatorAsTeamMember) => {
            setShowOwnershipDialog(false);
            handleAction("approve", addOldCreatorAsTeamMember);
          }}
        />
      )}
    </article>
  );
}

export function OutgoingRequestCard({
  request,
  onRequestUpdated,
}: RequestCardProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [localStatus, setLocalStatus] = useState(request.status);

  /**
   * Handles cancel action for outgoing requests
   */
  const handleCancel = async () => {
    setIsProcessing(true);
    try {
      const handler = CANCEL_HANDLERS[request.type];

      if (!handler) {
        throw new Error("Unknown request type");
      }

      await handler(request.id);
      const newStatus = "CANCELLED";
      setLocalStatus(newStatus);
      toast.success("Request cancelled");

      // Notify parent component to update its state
      if (onRequestUpdated) {
        onRequestUpdated(request.id, newStatus);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to cancel request"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const breadcrumbs = generateRequestBreadcrumbs(request);
  const resourceName = getResourceName(request);
  const resourceLink = getResourceLink(request);

  return (
    <article className="bg-secondary rounded-lg p-4 border-2">
      <div className="space-y-3">
        {/* Date - top left, muted, smaller text */}
        <time
          className="text-xs block"
          dateTime={request.createdAt.toISOString()}
        >
          {formatRelativeDate(new Date(request.createdAt))}
        </time>

        {/* Message: You requested Role Name for Link */}
        <p className="text-sm">
          You requested{" "}
          {request.type === "OWNERSHIP" ? (
            <>
              <strong>ownership</strong> of{" "}
            </>
          ) : (
            <>{request.role && <strong>{request.role}</strong>} for </>
          )}
          <Link
            href={resourceLink}
            className="text-primary-light hover:text-primary-light hover:underline"
          >
            {resourceName}
          </Link>
        </p>

        {/* Breadcrumb trail */}
        {breadcrumbs.length > 0 && (
          <nav
            className="flex items-center gap-1 text-xs"
            aria-label="Breadcrumb"
          >
            {breadcrumbs.map((crumb, index) => (
              <div key={crumb.href} className="flex items-center gap-1">
                <Link
                  href={crumb.href}
                  className="hover:text-primary-light hover:underline"
                >
                  {crumb.label}
                </Link>
                {index < breadcrumbs.length - 1 && (
                  <ChevronRight className="h-3 w-3" aria-hidden="true" />
                )}
              </div>
            ))}
          </nav>
        )}

        {/* Status */}
        <div className="text-sm">
          <span className="font-medium">Status:</span>{" "}
          <span className={getStatusColor(localStatus)}>{localStatus}</span>
        </div>

        {/* Cancel button (only for pending) */}
        {localStatus === "PENDING" && (
          <div className="pt-2">
            <Button
              onClick={handleCancel}
              disabled={isProcessing}
              variant="destructive"
              size="sm"
              className="hover:bg-destructive/70"
            >
              Cancel
            </Button>
          </div>
        )}
      </div>
    </article>
  );
}
