"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getNotifications,
  getNewNotificationCount,
  markNotificationAsOld,
  markAllNotificationsAsOld,
  getNotificationUrl,
} from "@/lib/server_actions/request_actions";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  relatedRequestType?: string | null;
  relatedRequestId?: string | null;
  isOld: boolean;
  createdAt: Date;
}

export function NotificationPopover() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [newCount, setNewCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loadNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      const [notifs, count] = await Promise.all([
        getNotifications(10, false), // Only get new notifications (isOld: false)
        getNewNotificationCount(),
      ]);
      // Filter out old notifications
      const newNotifs = notifs.filter((n) => !n.isOld);
      setNotifications(newNotifs);
      setNewCount(count);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load notifications on mount
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Refresh notifications when popover opens and periodically while open
  useEffect(() => {
    if (isOpen) {
      // Reload immediately when opening
      loadNotifications();
      // Then refresh every 30 seconds while open
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [isOpen, loadNotifications]);

  const handleNotificationClick = async (notification: Notification) => {
    try {
      // Mark as old first
      await markNotificationAsOld(notification.id);
      
      // Get navigation URL
      const url = await getNotificationUrl(notification.id);
      
      // Update local state - remove from list
      setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
      setNewCount((prev) => Math.max(0, prev - 1));
      setIsOpen(false);
      
      // Navigate if URL exists
      if (url) {
        router.push(url);
      }
    } catch (error) {
      console.error("Failed to handle notification click:", error);
    }
  };

  const handleMarkAllAsOld = async () => {
    try {
      await markAllNotificationsAsOld();
      // Clear notifications from list
      setNotifications([]);
      setNewCount(0);
    } catch (error) {
      console.error("Failed to mark all notifications as old:", error);
    }
  };

  // Helper to display message without navigation info for TAGGED, OWNERSHIP_TRANSFERRED, and ownership request notifications
  const getDisplayMessage = (notification: Notification): string => {
    if (
      notification.type === "TAGGED" ||
      notification.type === "OWNERSHIP_TRANSFERRED" ||
      notification.type === "OWNERSHIP_REQUESTED" ||
      notification.type === "OWNERSHIP_REQUEST_APPROVED" ||
      notification.type === "OWNERSHIP_REQUEST_DENIED"
    ) {
      // Remove navigation info part (everything after |)
      const message = notification.message;
      const mainMessage = message.split("|")[0];
      return mainMessage;
    }
    return notification.message;
  };

  const formatTime = (date: Date | string) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative cursor-pointer"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {newCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {newCount > 99 ? "99+" : newCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0"
        align="center"
        sideOffset={8}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex flex-col max-h-[500px]">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {newCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={handleMarkAllAsOld}
              >
                Mark all as old
              </Button>
            )}
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto">
            {isLoading && notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No notifications
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      "w-full text-left p-3 hover:bg-accent transition-colors",
                      "bg-blue-50 dark:bg-blue-950/20"
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <div className="h-2 w-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                          {getDisplayMessage(notification)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatTime(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
