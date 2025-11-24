"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Send } from "lucide-react";
import { AUTH_LEVELS, getAuthLevelName } from "@/lib/utils/auth-utils";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { createAuthLevelChangeRequest } from "@/lib/server_actions/request_actions";

interface AuthorizationRequestFormProps {
  currentUserAuthLevel: number;
  onRequestSubmitted?: () => void | Promise<void>;
}

export function AuthorizationRequestForm({
  currentUserAuthLevel,
  onRequestSubmitted,
}: AuthorizationRequestFormProps) {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  const [requestedLevel, setRequestedLevel] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (requestedLevel === null) {
      toast.error("Please select a requested authorization level");
      return;
    }

    if (!message.trim()) {
      toast.error(
        "Please provide a message explaining why you need this authorization level change"
      );
      return;
    }

    if (requestedLevel === currentUserAuthLevel) {
      toast.error("Selected level is the same as your current level");
      return;
    }

    if (requestedLevel < currentUserAuthLevel) {
      toast.error("You cannot request a lower authorization level");
      return;
    }

    if (!currentUserId) {
      toast.error("You must be logged in to submit a request");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createAuthLevelChangeRequest(
        currentUserId,
        requestedLevel,
        message.trim()
      );

      if (result.success) {
        toast.success(
          `Authorization level change request submitted successfully! Admins will review your request.`
        );
        // Reset form
        setRequestedLevel(null);
        setMessage("");
        // Refresh dashboard data to show the new request
        if (onRequestSubmitted) {
          await onRequestSubmitted();
        }
      }
    } catch (error) {
      console.error("Error creating auth level change request:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to submit authorization level change request"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auth level options - show all levels higher than current user's level
  const getAvailableLevels = () => {
    return Object.entries(AUTH_LEVELS)
      .map(([value]) => ({
        name: getAuthLevelName(Number(value)),
        value,
      }))
      .filter((option) => Number(option.value) > Number(currentUserAuthLevel))
      .sort((a, b) => Number(a.value) - Number(b.value));
  };

  const availableLevels = getAvailableLevels();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Request Authorization Level Change</CardTitle>
        <CardDescription>
          Submit a request to change your authorization level
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Auth Level Display */}
          <div className="p-3 bg-muted rounded-md">
            <div className="text-sm font-medium">
              Your Current Authorization Level
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              <span className="font-medium">
                {getAuthLevelName(currentUserAuthLevel)} ({currentUserAuthLevel}
                )
              </span>
            </div>
          </div>

          {/* Requested Level Selector */}
          <div className="space-y-2">
            <Label htmlFor="requested-level">
              Requested Authorization Level
            </Label>
            <Select
              value={requestedLevel !== null ? requestedLevel.toString() : ""}
              onValueChange={(value) => setRequestedLevel(parseInt(value))}
            >
              <SelectTrigger id="requested-level">
                <SelectValue placeholder="Select authorization level" />
              </SelectTrigger>
              <SelectContent>
                {availableLevels.length > 0 ? (
                  availableLevels.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value.toString()}
                    >
                      {option.name} ({option.value})
                    </SelectItem>
                  ))
                ) : (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    No higher levels available
                  </div>
                )}
              </SelectContent>
            </Select>
            {availableLevels.length === 0 && (
              <p className="text-xs text-muted-foreground">
                You have reached the highest authorization level available for
                requests.
              </p>
            )}
          </div>

          {/* Message Field */}
          <div className="space-y-2">
            <Label htmlFor="message">
              Explanation Message <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="message"
              placeholder="Explain why you need this authorization level change..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              required
            />
            <p className="text-xs text-muted-foreground">
              A message is required to explain the reason for this authorization
              level change request.
            </p>
          </div>

          {/* Submit Button */}
          {requestedLevel !== null &&
            requestedLevel > currentUserAuthLevel &&
            message.trim() && (
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Submit Request
                  </>
                )}
              </Button>
            )}

          {requestedLevel !== null &&
            requestedLevel <= currentUserAuthLevel && (
              <p className="text-sm text-muted-foreground text-center py-2">
                Selected level must be higher than your current level (
                {getAuthLevelName(currentUserAuthLevel)})
              </p>
            )}
        </form>
      </CardContent>
    </Card>
  );
}
