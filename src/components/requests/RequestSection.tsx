"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  IncomingRequestCard,
  OutgoingRequestCard,
} from "./RequestCard";

interface DashboardRequest {
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
}

interface RequestSectionProps {
  incomingRequests: DashboardRequest[];
  outgoingRequests: DashboardRequest[];
  onRequestUpdated?: (requestId: string, newStatus: string) => void;
}

export function RequestSection({
  incomingRequests,
  outgoingRequests,
  onRequestUpdated,
}: RequestSectionProps) {
  const [showOld, setShowOld] = useState(false);

  // Separate new (PENDING) and old (APPROVED/DENIED/CANCELLED) requests
  const newIncoming = incomingRequests.filter((r) => r.status === "PENDING");
  const oldIncoming = incomingRequests.filter((r) => r.status !== "PENDING");
  const newOutgoing = outgoingRequests.filter((r) => r.status === "PENDING");
  const oldOutgoing = outgoingRequests.filter((r) => r.status !== "PENDING");

  // Combine incoming and outgoing
  const allNew = [...newIncoming, ...newOutgoing];
  const allOld = [...oldIncoming, ...oldOutgoing];

  // Filter based on showOld toggle
  const filteredRequests = showOld ? allOld : allNew;

  // Sort newer to older
  const sortedRequests = [...filteredRequests].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Limit to 20
  const displayedRequests = sortedRequests.slice(0, 20);

  // Determine if request is incoming or outgoing
  const isIncoming = (request: DashboardRequest) => {
    return incomingRequests.some((r) => r.id === request.id);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Requests</CardTitle>
          {allOld.length > 0 && (
            <div className="flex items-center gap-2">
              <Label htmlFor="request-old-toggle" className="text-sm">
                Old
              </Label>
              <Switch
                id="request-old-toggle"
                checked={showOld}
                onCheckedChange={setShowOld}
              />
              <Label htmlFor="request-old-toggle" className="text-sm">
                New
              </Label>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {displayedRequests.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {showOld ? "No old requests" : "No requests"}
          </div>
        ) : (
          <div className="space-y-3">
            {displayedRequests.map((request) => {
              if (isIncoming(request)) {
                return (
                  <IncomingRequestCard
                    key={`incoming-${request.id}`}
                    request={request}
                    onRequestUpdated={onRequestUpdated}
                  />
                );
              } else {
                return (
                  <OutgoingRequestCard
                    key={`outgoing-${request.id}`}
                    request={request}
                    onRequestUpdated={onRequestUpdated}
                  />
                );
              }
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

