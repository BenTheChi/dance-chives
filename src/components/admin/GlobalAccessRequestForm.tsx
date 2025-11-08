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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { createGlobalAccessRequest } from "@/lib/server_actions/request_actions";

interface GlobalAccessRequestFormProps {
  onRequestSubmitted?: () => void | Promise<void>;
}

export function GlobalAccessRequestForm({
  onRequestSubmitted,
}: GlobalAccessRequestFormProps) {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      toast.error(
        "Please provide a message explaining why you need global access"
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createGlobalAccessRequest(message.trim());

      if (result.success) {
        toast.success(
          "Global access request submitted successfully! Admins will review your request."
        );
        // Reset form
        setMessage("");
        // Refresh dashboard data to show the new request
        if (onRequestSubmitted) {
          await onRequestSubmitted();
        }
      }
    } catch (error) {
      console.error("Error creating global access request:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to submit global access request"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Request Global Access</CardTitle>
        <CardDescription>
          Submit a request to gain access to edit events in all cities
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 bg-muted rounded-md">
            <div className="text-sm font-medium">What is Global Access?</div>
            <div className="text-sm text-muted-foreground mt-1">
              Global access allows you to edit events in all cities, not just
              your assigned cities. This is useful for creators and moderators
              who need to manage events across multiple locations.
            </div>
          </div>

          {/* Message Field */}
          <div className="space-y-2">
            <Label htmlFor="message">
              Explanation Message <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="message"
              placeholder="Explain why you need global access..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              required
            />
            <p className="text-xs text-muted-foreground">
              A message is required to explain the reason for this global
              access request.
            </p>
          </div>

          {/* Submit Button */}
          {message.trim() && (
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
        </form>
      </CardContent>
    </Card>
  );
}

