"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  approveTaggingRequest,
  denyTaggingRequest,
  approveTeamMemberRequest,
  denyTeamMemberRequest,
  approveAuthLevelChangeRequest,
  denyAuthLevelChangeRequest,
  cancelTaggingRequest,
  cancelTeamMemberRequest,
  cancelAuthLevelChangeRequest,
} from "@/lib/server_actions/request_actions";
import { toast } from "sonner";
import { useState } from "react";
import { formatRelativeDate } from "@/lib/utils/relative-date";
import { generateRequestBreadcrumbs } from "@/lib/utils/request-utils-client";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface RequestCardProps {
  request: {
    id: string;
    type: string;
    sender?: { id?: string; name?: string | null; email: string };
    targetUser?: { id?: string; name?: string | null; email: string };
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
const APPROVE_HANDLERS: Record<string, (id: string) => Promise<unknown>> = {
  TAGGING: approveTaggingRequest,
  TEAM_MEMBER: approveTeamMemberRequest,
  AUTH_LEVEL_CHANGE: approveAuthLevelChangeRequest,
};

const DENY_HANDLERS: Record<string, (id: string) => Promise<unknown>> = {
  TAGGING: denyTaggingRequest,
  TEAM_MEMBER: denyTeamMemberRequest,
  AUTH_LEVEL_CHANGE: denyAuthLevelChangeRequest,
};

const CANCEL_HANDLERS: Record<string, (id: string) => Promise<unknown>> = {
  TAGGING: cancelTaggingRequest,
  TEAM_MEMBER: cancelTeamMemberRequest,
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

  /**
   * Generic handler for approve/deny actions
   */
  const handleAction = async (action: "approve" | "deny") => {
    setIsProcessing(true);
    try {
      const handler =
        action === "approve"
          ? APPROVE_HANDLERS[request.type]
          : DENY_HANDLERS[request.type];

      if (!handler) {
        throw new Error("Unknown request type");
      }

      await handler(request.id);
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

  const breadcrumbs = generateRequestBreadcrumbs(request);
  const senderName =
    request.sender?.name || request.sender?.email || "Unknown";
  const resourceName = getResourceName(request);
  const resourceLink = getResourceLink(request);

  return (
    <Card className="bg-gray-300/10 dark:bg-gray-300/5 border-primary/20">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Date - top left, muted, smaller text */}
          <p className="text-xs text-muted-foreground">
            {formatRelativeDate(new Date(request.createdAt))}
          </p>

          {/* Message: Avatar + Display Name requested Role Name from Link */}
          <div className="flex items-center gap-2 text-sm">
            {request.sender && (
              <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600 shrink-0">
                {senderName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </div>
            )}
            <span>
              <strong>{senderName}</strong> requested{" "}
              {request.role && <strong>{request.role}</strong>} from{" "}
              <Link
                href={resourceLink}
                className="text-primary hover:underline"
              >
                {resourceName}
              </Link>
            </span>
          </div>

          {/* Breadcrumb trail */}
          {breadcrumbs.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {breadcrumbs.map((crumb, index) => (
                <div key={crumb.href} className="flex items-center gap-1">
                  <Link
                    href={crumb.href}
                    className="hover:text-primary hover:underline"
                  >
                    {crumb.label}
                  </Link>
                  {index < breadcrumbs.length - 1 && (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Approve/Deny buttons */}
          {localStatus === "PENDING" && (
            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => handleAction("approve")}
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
      </CardContent>
    </Card>
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
    <Card className="bg-gray-300/10 dark:bg-gray-300/5 border-primary/20">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Date - top left, muted, smaller text */}
          <p className="text-xs text-muted-foreground">
            {formatRelativeDate(new Date(request.createdAt))}
          </p>

          {/* Message: You requested Role Name for Link */}
          <div className="text-sm">
            You requested {request.role && <strong>{request.role}</strong>} for{" "}
            <Link
              href={resourceLink}
              className="text-primary hover:underline"
            >
              {resourceName}
            </Link>
          </div>

          {/* Breadcrumb trail */}
          {breadcrumbs.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {breadcrumbs.map((crumb, index) => (
                <div key={crumb.href} className="flex items-center gap-1">
                  <Link
                    href={crumb.href}
                    className="hover:text-primary hover:underline"
                  >
                    {crumb.label}
                  </Link>
                  {index < breadcrumbs.length - 1 && (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </div>
              ))}
            </div>
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
      </CardContent>
    </Card>
  );
}
