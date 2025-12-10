"use server";

import { auth } from "@/auth";
import { Resend } from "resend";
import * as z from "zod";

// Helper function to escape HTML characters
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

// Zod schema for report submission validation
const reportSubmissionSchema = z.object({
  username: z.string().min(1, "Username is required"),
  type: z.enum(["feedback", "violation", "support"], {
    required_error: "Report type is required",
  }),
  page: z.string().min(1, "Page is required"),
  feedback: z
    .string()
    .min(10, "Feedback must be at least 10 characters")
    .max(1000, "Feedback must be less than 1000 characters"),
});

/**
 * Submit a report by sending an email to reports@dancechives.com
 * @param formData - FormData containing report parameters and optional file
 * @returns Object with success status and optional error message
 */
export async function submitReport(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate authentication
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" };
    }

    // Extract data from FormData
    const username = formData.get("username") as string;
    const type = formData.get("type") as string;
    const page = formData.get("page") as string;
    const feedback = formData.get("feedback") as string;
    const file = formData.get("file") as File | null;

    // Validate inputs with Zod
    let validatedParams;
    try {
      validatedParams = reportSubmissionSchema.parse({
        username,
        type,
        page,
        feedback,
      });
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        const errorMessage = validationError.errors
          .map((e) => e.message)
          .join(", ");
        return { success: false, error: errorMessage };
      }
      return { success: false, error: "Invalid form data" };
    }

    // Process file if present
    let attachment: { filename: string; content: Buffer } | undefined;
    if (file && file.size > 0) {
      const arrayBuffer = await file.arrayBuffer();
      attachment = {
        filename: file.name,
        content: Buffer.from(arrayBuffer),
      };
    }

    // Get Resend API key and from email
    const apiKey = process.env.RESEND_API_KEY;
    const from = "reports@dancechives.com";

    if (!apiKey) {
      console.error("RESEND_API_KEY is not set. Report emails cannot be sent.");
      return { success: false, error: "Email service is not configured" };
    }

    // Format report type for display
    const reportTypeDisplay =
      validatedParams.type.charAt(0).toUpperCase() +
      validatedParams.type.slice(1);

    // Format timestamp
    const timestamp = new Date().toLocaleString("en-US", {
      dateStyle: "full",
      timeStyle: "long",
    });

    // Escape user input for HTML
    const escapedUsername = escapeHtml(validatedParams.username);
    const escapedPage = escapeHtml(validatedParams.page);
    const escapedFeedback = escapeHtml(validatedParams.feedback);
    const escapedFilename = attachment ? escapeHtml(attachment.filename) : "";

    // Construct email HTML body
    const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333; border-bottom: 2px solid #16a34a; padding-bottom: 10px;">
        New Report: ${reportTypeDisplay}
      </h2>
      
      <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; font-weight: bold; width: 150px;">Report Type:</td>
            <td style="padding: 8px 0;">${reportTypeDisplay}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Username:</td>
            <td style="padding: 8px 0;">${escapedUsername}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Page/URL:</td>
            <td style="padding: 8px 0;">
              <a href="${escapedPage}" style="color: #16a34a; text-decoration: none;">
                ${escapedPage}
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; vertical-align: top;">Feedback:</td>
            <td style="padding: 8px 0; white-space: pre-wrap;">${escapedFeedback}</td>
          </tr>
          ${
            attachment
              ? `
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Attachment:</td>
            <td style="padding: 8px 0;">${escapedFilename} (attached to email)</td>
          </tr>
          `
              : ""
          }
          <tr>
            <td style="padding: 8px 0; font-weight: bold;">Submitted:</td>
            <td style="padding: 8px 0;">${timestamp}</td>
          </tr>
        </table>
      </div>
      
      <p style="color: #666; font-size: 12px; margin-top: 20px;">
        This report was submitted through the Dance Chives reporting system.
      </p>
    </div>
  `;

    // Construct plain text body
    const textBody = `
New Report: ${reportTypeDisplay}

Report Type: ${reportTypeDisplay}
Username: ${validatedParams.username}
Page/URL: ${validatedParams.page}
Feedback: ${validatedParams.feedback}
${attachment ? `Attachment: ${attachment.filename} (attached to email)` : ""}
Submitted: ${timestamp}

This report was submitted through the Dance Chives reporting system.
    `.trim();

    try {
      const resend = new Resend(apiKey);

      const emailPayload: {
        from: string;
        to: string;
        subject: string;
        html: string;
        text: string;
        attachments?: Array<{ filename: string; content: Buffer }>;
      } = {
        from,
        to: "reports@dancechives.com",
        subject: `New Report: ${reportTypeDisplay}`,
        html: htmlBody,
        text: textBody,
      };

      // Add attachment if file is present
      if (attachment) {
        emailPayload.attachments = [attachment];
      }

      const { data, error } = await resend.emails.send(emailPayload);

      if (error) {
        console.error("Failed to send report email via Resend:", error);
        return {
          success: false,
          error: "Failed to send report email. Please try again later.",
        };
      }

      return { success: true };
    } catch (error) {
      console.error("Error sending report email via Resend:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred. Please try again later.",
      };
    }
  } catch (error) {
    console.error("Unexpected error in submitReport:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred. Please try again later.",
    };
  }
}
