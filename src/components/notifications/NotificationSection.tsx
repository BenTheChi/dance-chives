"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { NotificationCard } from "./NotificationCard";
import { markAllNotificationsAsOld } from "@/lib/server_actions/request_actions";
import { toast } from "sonner";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  relatedRequestType?: string | null;
  relatedRequestId?: string | null;
  isOld: boolean;
  createdAt: Date;
}

interface NotificationSectionProps {
  initialNotifications?: Notification[];
}

export function NotificationSection({
  initialNotifications = [],
}: NotificationSectionProps) {
  const [notifications, setNotifications] = useState<Notification[]>(
    initialNotifications
  );
  const [showOld, setShowOld] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/notifications?limit=20");
      if (response.ok) {
        const data = await response.json();
        setNotifications(Array.isArray(data) ? data : []);
      } else if (response.status === 401) {
        setNotifications([]);
      } else {
        const errorData = await response.json().catch(() => null);
        console.error(
          "Failed to load notifications:",
          errorData?.error || response.statusText
        );
        toast.error("Failed to load notifications");
      }
    } catch (error) {
      console.error("Failed to load notifications:", error);
      toast.error("Failed to load notifications");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialNotifications.length === 0) {
      loadNotifications();
    }
  }, []);

  const handleClearAll = async () => {
    setIsClearingAll(true);
    try {
      await markAllNotificationsAsOld();
      await loadNotifications();
      toast.success("All notifications marked as old");
    } catch (error) {
      toast.error("Failed to clear all notifications");
      console.error(error);
    } finally {
      setIsClearingAll(false);
    }
  };

  const handleMarkAsOld = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notificationId ? { ...notif, isOld: true } : notif
      )
    );
  };

  const filteredNotifications = notifications.filter(
    (notif) => notif.isOld === showOld
  );

  const newNotifications = notifications.filter((notif) => !notif.isOld);
  const oldNotifications = notifications.filter((notif) => notif.isOld);

  // Sort newer to older
  const sortedNotifications = [...filteredNotifications].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Limit to 20
  const displayedNotifications = sortedNotifications.slice(0, 20);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Notifications</CardTitle>
          {oldNotifications.length > 0 && (
            <div className="flex items-center gap-2">
              <Label htmlFor="old-toggle" className="text-sm">
                Old
              </Label>
              <Switch
                id="old-toggle"
                checked={showOld}
                onCheckedChange={setShowOld}
              />
              <Label htmlFor="old-toggle" className="text-sm">
                New
              </Label>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!showOld && newNotifications.length > 0 && (
          <div className="mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAll}
              disabled={isClearingAll}
            >
              Clear All
            </Button>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading notifications...
          </div>
        ) : displayedNotifications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {showOld ? "No old notifications" : "No new notifications"}
          </div>
        ) : (
          <div className="space-y-3">
            {displayedNotifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                context={{
                  // Context will be populated by parent component
                  // For now, pass empty context
                }}
                onMarkAsOld={handleMarkAsOld}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

