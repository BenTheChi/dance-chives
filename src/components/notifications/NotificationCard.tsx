"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatRelativeDate } from "@/lib/utils/relative-date";
import { formatNotificationMessage } from "@/lib/utils/notification-formatter";
import { markNotificationAsOld } from "@/lib/server_actions/request_actions";
import { toast } from "sonner";
import { useState } from "react";

interface NotificationCardProps {
  notification: {
    id: string;
    type: string;
    title: string;
    message: string;
    relatedRequestType?: string | null;
    relatedRequestId?: string | null;
    createdAt: Date;
  };
  context: {
    eventId?: string | null;
    eventTitle?: string | null;
    sectionId?: string | null;
    sectionTitle?: string | null;
    videoId?: string | null;
    videoTitle?: string | null;
    role?: string | null;
  };
  onMarkAsOld?: (notificationId: string) => void;
}

export function NotificationCard({
  notification,
  context,
  onMarkAsOld,
}: NotificationCardProps) {
  const [isMarking, setIsMarking] = useState(false);

  const handleMarkAsOld = async () => {
    setIsMarking(true);
    try {
      await markNotificationAsOld(notification.id);
      if (onMarkAsOld) {
        onMarkAsOld(notification.id);
      }
    } catch (error) {
      toast.error("Failed to mark notification as old");
      console.error(error);
    } finally {
      setIsMarking(false);
    }
  };

  return (
    <Card className="bg-gray-300/10 dark:bg-gray-300/5 border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {/* Date - top left, muted, smaller text */}
            <p className="text-xs text-muted-foreground mb-1">
              {formatRelativeDate(new Date(notification.createdAt))}
            </p>

            {/* Formatted message */}
            <div className="text-sm">
              {formatNotificationMessage(notification, context)}
            </div>
          </div>

          {/* X button - top right */}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={handleMarkAsOld}
            disabled={isMarking}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

