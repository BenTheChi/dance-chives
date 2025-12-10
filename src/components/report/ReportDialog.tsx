"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { submitReport } from "@/lib/server_actions/report_actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// Report types enum - matches server action schema
const REPORT_TYPES = ["feedback", "violation", "support"] as const;

// Report type display labels
const REPORT_TYPE_LABELS: Record<(typeof REPORT_TYPES)[number], string> = {
  feedback: "Feedback",
  violation: "Violation",
  support: "Support",
};

  // Zod schema for form validation - matches server action schema
const reportFormSchema = z.object({
  username: z.string().optional(),
  type: z.enum(REPORT_TYPES, {
    required_error: "Please select a report type",
  }),
  page: z.string().min(1, "Page is required"),
  feedback: z
    .string()
    .min(10, "Feedback must be at least 10 characters")
    .max(1000, "Feedback must be less than 1000 characters"),
});

type ReportFormValues = z.infer<typeof reportFormSchema>;

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username?: string;
  pageReference?: string;
}

export function ReportDialog({
  open,
  onOpenChange,
  username: propUsername,
  pageReference,
}: ReportDialogProps) {
  const { data: session } = useSession();
  const sessionUsername =
    session?.user?.username || session?.user?.displayName || session?.user?.name || "";
  const username = propUsername || sessionUsername;
  // Check if session.user?.name exists to determine if username should be disabled
  const hasSessionUsername = !!session?.user?.name;
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportFormSchema),
    mode: "onChange",
    defaultValues: {
      username: username || "",
      type: undefined,
      page: pageReference || "",
      feedback: "",
    },
  });

  // Update form when props change
  useEffect(() => {
    if (username) {
      form.setValue("username", username);
    }
    if (pageReference) {
      form.setValue("page", pageReference);
    }
  }, [username, pageReference, form]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      form.reset({
        username: username || "",
        type: undefined,
        page: pageReference || "",
        feedback: "",
      });
      setSelectedFile(null);
      setSelectedFileName("");
      setIsSubmitting(false);
    }
  }, [open, username, pageReference, form]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      setSelectedFileName("");
      return;
    }

    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      toast.error(
        `File size exceeds maximum allowed size of ${
          MAX_FILE_SIZE / 1024 / 1024
        }MB`
      );
      e.target.value = ""; // Reset input
      setSelectedFile(null);
      setSelectedFileName("");
      return;
    }

    setSelectedFile(file);
    setSelectedFileName(file.name);
  };

  const onSubmit = async (data: ReportFormValues) => {
    setIsSubmitting(true);
    try {
      // Create FormData to send file if present
      const formData = new FormData();
      // Map empty username to "Anonymous" before submitting
      formData.append("username", data.username || "Anonymous");
      formData.append("type", data.type);
      formData.append("page", data.page);
      formData.append("feedback", data.feedback);
      
      if (selectedFile) {
        formData.append("file", selectedFile);
      }

      // Map form data to server action parameters
      const result = await submitReport(formData);

      if (result.success) {
        toast.success("Report submitted successfully!");
        // Close dialog and reset form
        onOpenChange(false);
        form.reset({
          username: username || "",
          type: undefined,
          page: pageReference || "",
          feedback: "",
        });
        setSelectedFile(null);
        setSelectedFileName("");
      } else {
        // Handle error from server action
        toast.error(result.error || "Failed to submit report. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting report:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to submit report. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    form.reset();
    onOpenChange(false);
  };

  // Check if form is valid - type and feedback are required
  const watchedType = form.watch("type");
  const watchedFeedback = form.watch("feedback");
  const isFormValid =
    !!watchedType &&
    !!watchedFeedback &&
    watchedFeedback.trim().length >= 10 &&
    form.formState.isValid;

  return (
    <>
      <DialogHeader>
        <DialogTitle>Report Content</DialogTitle>
        <DialogDescription>
          Submit a report about inappropriate content, spam, or other issues.
          Your report will be reviewed by administrators.
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Username Field */}
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    disabled={hasSessionUsername} 
                    placeholder={hasSessionUsername ? "Your username" : "Enter your username (optional)"} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Report Type Select */}
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Report Type <span className="text-destructive">*</span>
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || ""}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a report type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {REPORT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {REPORT_TYPE_LABELS[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Page Field */}
          <FormField
            control={form.control}
            name="page"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Page</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Page URL or description"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Feedback Textarea */}
          <FormField
            control={form.control}
            name="feedback"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Feedback <span className="text-destructive">*</span>
                </FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Please provide details about what you're reporting..."
                    rows={4}
                  />
                </FormControl>
                <FormMessage />
                <p className="text-xs text-muted-foreground">
                  Please provide at least 10 characters describing the issue.
                </p>
              </FormItem>
            )}
          />

          {/* File Upload */}
          <FormItem>
            <FormLabel>Attach File (Optional)</FormLabel>
            <FormControl>
              <div className="space-y-2">
                <Input
                  type="file"
                  onChange={handleFileChange}
                  disabled={isSubmitting}
                  accept="image/*"
                />
                {/* File Selection Status Feedback */}
                {selectedFile && selectedFileName && (
                  <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>File selected: {selectedFileName}</span>
                  </div>
                )}
              </div>
            </FormControl>
            <p className="text-xs text-muted-foreground">
              Maximum file size: 10MB. File will be sent as an email attachment.
            </p>
          </FormItem>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!isFormValid || isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Report"
              )}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  );
}
