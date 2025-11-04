"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  approveTaggingRequest,
  denyTaggingRequest,
  approveTeamMemberRequest,
  denyTeamMemberRequest,
  approveGlobalAccessRequest,
  denyGlobalAccessRequest,
  approveAuthLevelChangeRequest,
  denyAuthLevelChangeRequest,
} from "@/lib/server_actions/request_actions";
import { toast } from "sonner";
import { useState } from "react";

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
    role?: string;
    status: string;
    createdAt: Date;
    requestedLevel?: number;
    currentLevel?: number;
    message?: string;
  };
}

export function IncomingRequestCard({ request }: RequestCardProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      switch (request.type) {
        case "TAGGING":
          await approveTaggingRequest(request.id);
          break;
        case "TEAM_MEMBER":
          await approveTeamMemberRequest(request.id);
          break;
        case "GLOBAL_ACCESS":
          await approveGlobalAccessRequest(request.id);
          break;
        case "AUTH_LEVEL_CHANGE":
          await approveAuthLevelChangeRequest(request.id);
          break;
        default:
          throw new Error("Unknown request type");
      }
      toast.success("Request approved");
      // Refresh the page to update the UI
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to approve request"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeny = async () => {
    setIsProcessing(true);
    try {
      switch (request.type) {
        case "TAGGING":
          await denyTaggingRequest(request.id);
          break;
        case "TEAM_MEMBER":
          await denyTeamMemberRequest(request.id);
          break;
        case "GLOBAL_ACCESS":
          await denyGlobalAccessRequest(request.id);
          break;
        case "AUTH_LEVEL_CHANGE":
          await denyAuthLevelChangeRequest(request.id);
          break;
        default:
          throw new Error("Unknown request type");
      }
      toast.success("Request denied");
      // Refresh the page to update the UI
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to deny request"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const getTaggingTypeTitle = () => {
    if (request.type === "TAGGING") {
      if (request.videoTitle || request.videoId) {
        return "Video Tag";
      } else if (request.role) {
        return "Role Tag";
      }
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {request.type === "TAGGING" && getTaggingTypeTitle()
            ? getTaggingTypeTitle()
            : request.type === "TEAM_MEMBER"
            ? "Team Member Request"
            : request.type === "GLOBAL_ACCESS"
            ? "Global Access Request"
            : request.type === "AUTH_LEVEL_CHANGE"
            ? "Authorization Level Change Request"
            : "Request"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm text-muted-foreground space-y-1">
          {request.type === "TAGGING" && (
            <>
              {request.sender && (
                <p>
                  <span className="font-medium">Requestor:</span>{" "}
                  {request.sender.name}
                </p>
              )}
              {request.eventTitle && (
                <p>
                  <span className="font-medium">Event:</span>{" "}
                  {request.eventTitle}
                </p>
              )}
              {request.videoTitle && (
                <p>
                  <span className="font-medium">Video:</span>{" "}
                  {request.videoTitle}
                </p>
              )}
              {request.role && (
                <p>
                  <span className="font-medium">Role:</span> {request.role}
                </p>
              )}
            </>
          )}
          {request.type === "TEAM_MEMBER" && request.eventTitle && (
            <p>
              <span className="font-medium">Event:</span> {request.eventTitle}
            </p>
          )}
          <p>
            <span className="font-medium">Status:</span> {request.status}
          </p>
          <p>
            <span className="font-medium">Created:</span>{" "}
            {new Date(request.createdAt).toLocaleDateString()}{" "}
            {new Date(request.createdAt).toLocaleTimeString()}
          </p>
        </div>
        {request.status === "PENDING" && (
          <div className="flex gap-2">
            <Button
              onClick={handleApprove}
              disabled={isProcessing}
              variant="default"
              size="sm"
            >
              Approve
            </Button>
            <Button
              onClick={handleDeny}
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

export function OutgoingRequestCard({ request }: RequestCardProps) {
  const getStatusColor = () => {
    switch (request.status) {
      case "APPROVED":
        return "text-green-600";
      case "DENIED":
        return "text-red-600";
      case "PENDING":
        return "text-yellow-600";
      default:
        return "text-muted-foreground";
    }
  };

  const getTaggingTypeTitle = () => {
    if (request.type === "TAGGING") {
      if (request.videoTitle || request.videoId) {
        return "Video Tag";
      } else if (request.role) {
        return "Role Tag";
      }
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {request.type === "TAGGING" && getTaggingTypeTitle()
            ? getTaggingTypeTitle()
            : request.type === "TEAM_MEMBER"
            ? "Team Member Request"
            : request.type === "GLOBAL_ACCESS"
            ? "Global Access Request"
            : request.type === "AUTH_LEVEL_CHANGE"
            ? "Authorization Level Change Request"
            : "Request"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm space-y-1">
          {request.type === "TAGGING" && (
            <>
              {request.sender && (
                <p>
                  <span className="font-medium">Requestor:</span>{" "}
                  {request.sender.name}
                </p>
              )}
              {request.eventTitle && (
                <p className="text-muted-foreground">
                  <span className="font-medium">Event:</span>{" "}
                  {request.eventTitle}
                </p>
              )}
              {request.videoTitle && (
                <p className="text-muted-foreground">
                  <span className="font-medium">Video:</span>{" "}
                  {request.videoTitle}
                </p>
              )}
              {request.role && (
                <p className="text-muted-foreground">
                  <span className="font-medium">Role:</span> {request.role}
                </p>
              )}
            </>
          )}
          {request.type === "TEAM_MEMBER" && request.eventTitle && (
            <p className="text-muted-foreground">
              <span className="font-medium">Event:</span> {request.eventTitle}
            </p>
          )}
          <p className={getStatusColor()}>
            <span className="font-medium">Status:</span> {request.status}
          </p>
          <p className="text-muted-foreground">
            <span className="font-medium">Created:</span>{" "}
            {new Date(request.createdAt).toLocaleDateString()}{" "}
            {new Date(request.createdAt).toLocaleTimeString()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
