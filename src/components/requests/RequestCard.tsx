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
    videoId?: string;
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

  const getRequestDescription = () => {
    switch (request.type) {
      case "TAGGING":
        return `${request.sender?.name || request.sender?.email} wants to tag ${
          request.targetUser?.name || request.targetUser?.email
        }${request.role ? ` as ${request.role}` : ""}${
          request.videoId ? " in a video" : ""
        }`;
      case "TEAM_MEMBER":
        return `${
          request.sender?.name || request.sender?.email
        } wants to join as a team member`;
      case "GLOBAL_ACCESS":
        return `${
          request.sender?.name || request.sender?.email
        } is requesting global access`;
      case "AUTH_LEVEL_CHANGE":
        return `${
          request.sender?.name || request.sender?.email
        } wants to change ${
          request.targetUser?.name || request.targetUser?.email
        }'s authorization level from ${request.currentLevel ?? 0} to ${
          request.requestedLevel ?? 0
        }${request.message ? ` - ${request.message}` : ""}`;
      default:
        return "New request";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {request.type === "TAGGING" && "Tagging Request"}
          {request.type === "TEAM_MEMBER" && "Team Member Request"}
          {request.type === "GLOBAL_ACCESS" && "Global Access Request"}
          {request.type === "AUTH_LEVEL_CHANGE" &&
            "Authorization Level Change Request"}
        </CardTitle>
        <CardDescription>{getRequestDescription()}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm text-muted-foreground">
          <p>Status: {request.status}</p>
          <p>Created: {new Date(request.createdAt).toLocaleDateString()}</p>
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
  const getRequestDescription = () => {
    switch (request.type) {
      case "TAGGING":
        return `Tagging request for ${
          request.targetUser?.name || request.targetUser?.email
        }${request.role ? ` as ${request.role}` : ""}`;
      case "TEAM_MEMBER":
        return `Team member request for event`;
      case "GLOBAL_ACCESS":
        return `Global access request`;
      case "AUTH_LEVEL_CHANGE":
        return `Authorization level change request for ${
          request.targetUser?.name || request.targetUser?.email
        } (${request.currentLevel ?? 0} → ${request.requestedLevel ?? 0})`;
      default:
        return "Request";
    }
  };

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {request.type === "TAGGING" && "Tagging Request"}
          {request.type === "TEAM_MEMBER" && "Team Member Request"}
          {request.type === "GLOBAL_ACCESS" && "Global Access Request"}
          {request.type === "AUTH_LEVEL_CHANGE" &&
            "Authorization Level Change Request"}
        </CardTitle>
        <CardDescription>{getRequestDescription()}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-sm">
          <p className={getStatusColor()}>Status: {request.status}</p>
          <p className="text-muted-foreground">
            Created: {new Date(request.createdAt).toLocaleDateString()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
