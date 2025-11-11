"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useState, ReactElement } from "react";
import { VIDEO_ROLE_DANCER } from "@/lib/utils/roles";

interface RequestCardProps {
  request: {
    id: string;
    type: string;
    sender?: { name?: string; email: string };
    targetUser?: { name?: string; email: string };
    eventId?: string;
    eventTitle?: string;
    videoId?: string;
    videoTitle?: string | null;
    sectionId?: string;
    sectionTitle?: string | null;
    role?: string;
    status: string;
    createdAt: Date;
    requestedLevel?: number;
    currentLevel?: number;
    message?: string;
  };
  onRequestUpdated?: (requestId: string, newStatus: string) => void;
}

// Request type to action handler mapping
const APPROVE_HANDLERS: Record<string, (id: string) => Promise<any>> = {
  TAGGING: approveTaggingRequest,
  TEAM_MEMBER: approveTeamMemberRequest,
  AUTH_LEVEL_CHANGE: approveAuthLevelChangeRequest,
};

const DENY_HANDLERS: Record<string, (id: string) => Promise<any>> = {
  TAGGING: denyTaggingRequest,
  TEAM_MEMBER: denyTeamMemberRequest,
  AUTH_LEVEL_CHANGE: denyAuthLevelChangeRequest,
};

const CANCEL_HANDLERS: Record<string, (id: string) => Promise<any>> = {
  TAGGING: cancelTaggingRequest,
  TEAM_MEMBER: cancelTeamMemberRequest,
  AUTH_LEVEL_CHANGE: cancelAuthLevelChangeRequest,
};

/**
 * Gets the display title for a request based on its type
 */
function getRequestTitle(
  type: string,
  videoTitle?: string | null,
  videoId?: string,
  sectionTitle?: string | null,
  sectionId?: string,
  role?: string
): string {
  if (type === "TAGGING") {
    if (videoTitle || videoId) {
      // For video tags, always show the role (default to "Dancer" if missing)
      const displayRole = role || VIDEO_ROLE_DANCER;
      return `Video Tag - ${displayRole}`;
    }
    if (sectionTitle || sectionId) {
      return role ? `Section Tag - ${role}` : "Section Tag";
    }
    if (role) return `Role Tag - ${role}`;
  }
  if (type === "TEAM_MEMBER") return "Team Member Request";
  if (type === "AUTH_LEVEL_CHANGE") return "Authorization Level Change Request";
  return "Request";
}

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
 * Renders request-specific details based on request type
 */
function renderRequestDetails(
  request: RequestCardProps["request"]
): ReactElement[] {
  const details: ReactElement[] = [];
  console.log(request);

  // Common: sender information
  if (request.sender) {
    details.push(
      <p key="sender">
        <span className="font-medium">Requestor:</span>{" "}
        {request.sender.name || request.sender.email}
      </p>
    );
  }

  // Tagging request details
  if (request.type === "TAGGING") {
    if (request.eventTitle) {
      details.push(
        <p key="event">
          <span className="font-medium">Event:</span> {request.eventTitle}
        </p>
      );
    }
    if (request.videoTitle) {
      details.push(
        <p key="video">
          <span className="font-medium">Video:</span> {request.videoTitle}
        </p>
      );
    }
    if (request.sectionTitle) {
      details.push(
        <p key="section">
          <span className="font-medium">Section:</span> {request.sectionTitle}
        </p>
      );
    }
    if (request.role) {
      details.push(
        <p key="role">
          <span className="font-medium">Role:</span> {request.role}
        </p>
      );
    }
  }

  // Team member request details
  if (request.type === "TEAM_MEMBER" && request.eventTitle) {
    details.push(
      <p key="event">
        <span className="font-medium">Event:</span> {request.eventTitle}
      </p>
    );
  }

  // Auth level change request details
  if (request.type === "AUTH_LEVEL_CHANGE") {
    if (request.currentLevel !== undefined) {
      details.push(
        <p key="current-level">
          <span className="font-medium">Current Level:</span>{" "}
          {request.currentLevel}
        </p>
      );
    }
    if (request.requestedLevel !== undefined) {
      details.push(
        <p key="requested-level">
          <span className="font-medium">Requested Level:</span>{" "}
          {request.requestedLevel}
        </p>
      );
    }
  }

  // Message display (for auth level change)
  if (request.message && request.type === "AUTH_LEVEL_CHANGE") {
    details.push(
      <div key="message" className="mt-2 p-3 bg-muted rounded-md">
        <p className="font-medium text-sm mb-1">Message:</p>
        <p className="text-sm whitespace-pre-wrap">{request.message}</p>
      </div>
    );
  }

  return details;
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

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">
          {getRequestTitle(
            request.type,
            request.videoTitle,
            request.videoId,
            request.sectionTitle,
            request.sectionId,
            request.role
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm space-y-1">
          {renderRequestDetails(request)}
          <p>
            <span className="font-medium">Status:</span>{" "}
            <span className={getStatusColor(localStatus)}>{localStatus}</span>
          </p>
          <p>
            <span className="font-medium">Created:</span>{" "}
            {formatDate(request.createdAt)}
          </p>
        </div>
        {localStatus === "PENDING" && (
          <div className="flex gap-2">
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

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">
          {getRequestTitle(
            request.type,
            request.videoTitle,
            request.videoId,
            request.sectionTitle,
            request.sectionId,
            request.role
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm space-y-1">
          {request.type === "TAGGING" && renderRequestDetails(request)}
          {request.type === "AUTH_LEVEL_CHANGE" &&
            request.requestedLevel !== undefined && (
              <p>
                <span className="font-medium">Requested Level:</span>{" "}
                {request.requestedLevel}
              </p>
            )}
          {request.type === "TEAM_MEMBER" && request.eventTitle && (
            <p>
              <span className="font-medium">Event:</span> {request.eventTitle}
            </p>
          )}
          <p className={getStatusColor(localStatus)}>
            <span className="font-medium">Status:</span> {localStatus}
          </p>
          <p>
            <span className="font-medium">Created:</span>{" "}
            {formatDate(request.createdAt)}
          </p>
        </div>
        {localStatus === "PENDING" && (
          <div className="flex gap-2 mt-2">
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
      </CardContent>
    </Card>
  );
}
