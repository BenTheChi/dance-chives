/**
 * MailerLite API integration
 * Adds subscribers to MailerLite groups
 */

interface MailerLiteSubscriber {
  email: string;
  name?: string;
  groups?: string[];
}

/**
 * Add a subscriber to MailerLite
 * @param email - Subscriber email address
 * @param name - Subscriber name (optional)
 * @param groupId - Group ID or name to add subscriber to (defaults to MAILERLITE_GROUP_ID env var or 'subscribers')
 * @returns Success status and any error message
 */
export async function addMailerLiteSubscriber(
  email: string,
  name?: string,
  groupId?: string
): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.MAILERLITE_API_KEY;
  // Use provided groupId, or environment variable, or default to 'subscribers'
  const targetGroupId = groupId || process.env.MAILERLITE_GROUP_ID || "subscribers";

  if (!apiKey) {
    console.warn("MailerLite API key not configured");
    return {
      success: false,
      error: "MailerLite API key not configured",
    };
  }

  try {
    // First, create or update the subscriber
    const subscriberData: MailerLiteSubscriber = {
      email,
      ...(name && { name }),
    };

    const subscriberResponse = await fetch(
      "https://connect.mailerlite.com/api/subscribers",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(subscriberData),
      }
    );

    if (!subscriberResponse.ok) {
      const errorData = await subscriberResponse.json().catch(() => ({}));
      console.error("MailerLite subscriber creation failed:", errorData);
      
      // If subscriber already exists (409), that's okay, we'll still try to add to group
      if (subscriberResponse.status !== 409) {
        return {
          success: false,
          error: `Failed to create subscriber: ${subscriberResponse.statusText}`,
        };
      }
    }

    // Add subscriber to the specified group
    const groupResponse = await fetch(
      `https://connect.mailerlite.com/api/groups/${targetGroupId}/subscribers`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ email }),
      }
    );

    if (!groupResponse.ok) {
      const errorData = await groupResponse.json().catch(() => ({}));
      console.error("MailerLite group assignment failed:", errorData);
      
      // If already in group (409), that's okay
      if (groupResponse.status !== 409) {
        return {
          success: false,
          error: `Failed to add subscriber to group: ${groupResponse.statusText}`,
        };
      }
    }

    return { success: true };
  } catch (error) {
    console.error("MailerLite subscription error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

