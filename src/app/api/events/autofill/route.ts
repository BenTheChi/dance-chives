import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  callOpenRouterVisionAPI,
  callOpenRouterTextAPI,
} from "@/lib/openrouter-vision";
import { validateDanceStyles, DANCE_STYLES } from "@/lib/utils/dance-styles";
import sharp from "sharp";

// Helper functions to normalize social media links (same as in event-form.tsx)
const normalizeInstagram = (
  input: string | undefined | null
): string | undefined => {
  if (!input || input.trim() === "") return undefined;
  const trimmed = input.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  const username = trimmed
    .replace(/^@/, "")
    .replace(/^instagram\.com\//, "")
    .trim();
  if (!username || username === "") return undefined;
  return `https://instagram.com/${username}`;
};

const normalizeYouTube = (
  input: string | undefined | null
): string | undefined => {
  if (!input || input.trim() === "") return undefined;
  const trimmed = input.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  const username = trimmed
    .replace(/^@/, "")
    .replace(/^youtube\.com\//, "")
    .replace(/^youtu\.be\//, "")
    .trim();
  if (!username || username === "") return undefined;
  return `https://youtube.com/@${username}`;
};

const normalizeFacebook = (
  input: string | undefined | null
): string | undefined => {
  if (!input || input.trim() === "") return undefined;
  const trimmed = input.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  const username = trimmed
    .replace(/^@/, "")
    .replace(/^facebook\.com\//, "")
    .replace(/^fb\.com\//, "")
    .trim();
  if (!username || username === "") return undefined;
  return `https://facebook.com/${username}`;
};

const AUTOFILL_PROMPT = `
You are an expert at extracting event information from dance event posters and social media posts.

Analyze the provided image and text to extract event details. Return a JSON object matching this structure:

{
  "title": "string (required)",
  "eventType": "Battle | Competition | Class | Workshop | Session | Party | Festival | Performance | Other",
  "dates": [{"date": "MM/DD/YYYY", "startTime": "HH:MM (optional)", "endTime": "HH:MM (optional)"}],
  "location": "string (use \"\" if missing)",
  "description": "string (use \"\" if missing)",
  "schedule": "string (use \"\" if missing)",
  "cost": "string (use \"\" if missing)",
  "prize": "string (use \"\" if missing)",
  "styles": ["string array - ONLY from allowed list, use [] if none found"],
  "cityName": "string (city name only, optional - omit if not clear)",
  "website": "string (URL, use \"\" if missing)",
  "instagram": "string (URL or @username, use \"\" if missing)",
  "youtube": "string (URL or @username, use \"\" if missing)",
  "facebook": "string (URL or username, use \"\" if missing)"
}

CRITICAL RULES:
- Dates must be in MM/DD/YYYY format
- Times must be in 24-hour HH:MM format (e.g., "14:30" for 2:30 PM)
- **For missing optional string fields, use empty string "" (NOT null)**
  - description, schedule, location, cost, prize, website, instagram, youtube, facebook should be "" if missing
- **For missing styles, use empty array [] (NOT null)**
- **For missing times, omit the field or use undefined (NOT null)**
- cityName is OPTIONAL - only include if clearly visible in poster/text, otherwise omit the field
- Location should be in the form of 'Venue Name (address if available)'
- Normalize social media handles to full URLs when possible
- Return only valid JSON, no markdown, no code blocks

DESCRIPTION FIELD RULES:
The description field should ONLY contain promotional content, social elements, and additional context that is NOT already captured in other fields. 

INCLUDE in description:
- Copywrite, promotional language, taglines
- @mentions and shout-outs to organizers, sponsors, judges, DJs, etc.
- Acknowledgements and thank you messages
- Hashtags (#hashtags)
- Motivational or inspirational text
- Additional context about the event's purpose or community
- Any other promotional or social content

EXCLUDE from description (these go to other fields):
- Schedule/timeline information → goes to "schedule" field
- Date and time information → goes to "dates" field
- Location/venue information → goes to "location" field
- Cost/price information → goes to "cost" field
- Prize information → goes to "prize" field
- Event title → goes to "title" field
- Event type → goes to "eventType" field
- Dance styles → goes to "styles" array
- Social media links → goes to respective social media fields

Example: If the text says "Join us on 12/25/2024 at 7pm at Studio 54. Tickets $20. Prize: $500. @dancecrew #hiphop", then:
- dates: [{"date": "12/25/2024", "startTime": "19:00"}]
- location: "Studio 54"
- cost: "$20"
- prize: "$500"
- description: "Join us! @dancecrew #hiphop" (keep the social/promotional parts, remove the structured data)

DANCE STYLES - ONLY use these exact style names (case-sensitive):
${DANCE_STYLES.map((style) => `- ${style}`).join("\n")}

DO NOT use any other style names. If a style is mentioned that's not in this list, omit it from the styles array. If not sure default it to Open Styles
`;

const AUTOFILL_TEXT_ONLY_PROMPT = `
You are an expert at extracting event information from dance event social media posts and text descriptions.

Analyze the provided text to extract event details. Return a JSON object matching this structure:

{
  "title": "string (required)",
  "eventType": "Battle | Competition | Class | Workshop | Session | Party | Festival | Performance | Other",
  "dates": [{"date": "MM/DD/YYYY", "startTime": "HH:MM (optional)", "endTime": "HH:MM (optional)"}],
  "location": "string (use \"\" if missing)",
  "description": "string (use \"\" if missing)",
  "schedule": "string (use \"\" if missing)",
  "cost": "string (use \"\" if missing)",
  "prize": "string (use \"\" if missing)",
  "styles": ["string array - ONLY from allowed list, use [] if none found"],
  "cityName": "string (city name only, optional - omit if not clear)",
  "website": "string (URL, use \"\" if missing)",
  "instagram": "string (URL or @username, use \"\" if missing)",
  "youtube": "string (URL or @username, use \"\" if missing)",
  "facebook": "string (URL or username, use \"\" if missing)"
}

CRITICAL RULES:
- Dates must be in MM/DD/YYYY format
- Times must be in 24-hour HH:MM format (e.g., "14:30" for 2:30 PM)
- **For missing optional string fields, use empty string "" (NOT null)**
  - description, schedule, location, cost, prize, website, instagram, youtube, facebook should be "" if missing
- **For missing styles, use empty array [] (NOT null)**
- **For missing times, omit the field or use undefined (NOT null)**
- cityName is OPTIONAL - only include if clearly mentioned in text, otherwise omit the field
- Location should be in the form of 'Venue Name (address if available)'
- Normalize social media handles to full URLs when possible
- Return only valid JSON, no markdown, no code blocks

TEXT-SPECIFIC EXTRACTION GUIDELINES:
- Look for dates in various formats (MM/DD/YYYY, "December 25th", "Dec 25", etc.) and convert to MM/DD/YYYY
- Extract times in any format (7pm, 7:00 PM, 19:00, etc.) and convert to 24-hour HH:MM format
- Look for location mentions (venue names, addresses, "at [place]", etc.)
- Extract cost information ($20, "Free", "Tickets $10-15", etc.)
- Extract prize information if mentioned
- Identify event type from keywords (battle, competition, class, workshop, session, party, festival, performance)
- Extract dance styles mentioned in the text
- Look for social media handles (@username) and URLs
- Extract website URLs if mentioned

DESCRIPTION FIELD RULES:
The description field should ONLY contain promotional content, social elements, and additional context that is NOT already captured in other fields. 

INCLUDE in description:
- Copywrite, promotional language, taglines
- @mentions and shout-outs to organizers, sponsors, judges, DJs, etc.
- Acknowledgements and thank you messages
- Hashtags (#hashtags)
- Motivational or inspirational text
- Additional context about the event's purpose or community
- Any other promotional or social content

EXCLUDE from description (these go to other fields):
- Schedule/timeline information → goes to "schedule" field
- Date and time information → goes to "dates" field
- Location/venue information → goes to "location" field
- Cost/price information → goes to "cost" field
- Prize information → goes to "prize" field
- Event title → goes to "title" field
- Event type → goes to "eventType" field
- Dance styles → goes to "styles" array
- Social media links → goes to respective social media fields

DANCE STYLES - ONLY use these exact style names (case-sensitive):
${DANCE_STYLES.map((style) => `- ${style}`).join("\n")}

DO NOT use any other style names. If a style is mentioned that's not in this list, omit it from the styles array. If not sure default it to Open Styles
`;

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get API key
    const openRouterApiKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterApiKey) {
      return NextResponse.json(
        { error: "OpenRouter API key not configured" },
        { status: 500 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const posterFile = formData.get("poster") as File | null;
    const textInput = (formData.get("text") as string) || "";

    // Require either poster or text input
    if (!posterFile && !textInput.trim()) {
      return NextResponse.json(
        { error: "Either a poster image or text input is required" },
        { status: 400 }
      );
    }

    const isTextOnly = !posterFile && textInput.trim().length > 0;

    let aiResponse;

    if (isTextOnly) {
      // Text-only mode: use text-specific prompt and text-only API
      const fullPrompt = `${AUTOFILL_TEXT_ONLY_PROMPT}\n\nText to analyze:\n${textInput}`;

      try {
        aiResponse = await callOpenRouterTextAPI(fullPrompt, openRouterApiKey);
      } catch (error) {
        console.error("Autofill text-only API error:", error);
        return NextResponse.json(
          {
            error:
              error instanceof Error
                ? error.message
                : "Failed to analyze text with AI",
          },
          { status: 500 }
        );
      }
    } else {
      // Image mode: validate and process image
      if (!posterFile) {
        return NextResponse.json(
          { error: "Poster image is required when not using text-only mode" },
          { status: 400 }
        );
      }

      // TypeScript: posterFile is guaranteed to be non-null here
      const file = posterFile;

      // Validate file type - accept images including HEIC
      const fileExtension = file.name.split(".").pop()?.toLowerCase();
      const isHeic =
        fileExtension === "heic" ||
        fileExtension === "heif" ||
        file.type === "image/heic" ||
        file.type === "image/heif";

      if (
        !file.type.startsWith("image/") &&
        !isHeic &&
        !["heic", "heif"].includes(fileExtension || "")
      ) {
        return NextResponse.json(
          { error: "File must be an image" },
          { status: 400 }
        );
      }

      // Validate file size (8MB max)
      const MAX_FILE_SIZE = 8 * 1024 * 1024;
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: "File size exceeds 8MB limit" },
          { status: 400 }
        );
      }

      // Convert File to Buffer
      const arrayBuffer = await file.arrayBuffer();
      let buffer: Buffer = Buffer.from(arrayBuffer);

      // Convert HEIC/HEIF to JPEG for compatibility with vision API
      if (isHeic) {
        try {
          buffer = (await sharp(buffer)
            .jpeg({ quality: 90 })
            .toBuffer()) as Buffer;
        } catch (error) {
          console.error("Error converting HEIC image:", error);
          return NextResponse.json(
            {
              error:
                "Failed to process HEIC image. Please convert it to JPEG or PNG first.",
            },
            { status: 400 }
          );
        }
      } else {
        // For other formats, ensure we have a valid image buffer
        // Sharp can handle most formats, but we'll convert to JPEG for consistency
        try {
          const metadata = await sharp(buffer).metadata();
          // If sharp can read it, convert to JPEG for API compatibility
          if (metadata.format) {
            buffer = (await sharp(buffer)
              .jpeg({ quality: 90 })
              .toBuffer()) as Buffer;
          }
        } catch (error) {
          // If sharp can't process it, try using the original buffer
          // This handles cases where the file might be a valid image but sharp doesn't support it
          console.warn(
            "Could not process image with sharp, using original:",
            error
          );
        }
      }

      // Convert image to base64
      const base64Image = buffer.toString("base64");

      // Build prompt with text input if provided
      let fullPrompt = AUTOFILL_PROMPT;
      if (textInput.trim()) {
        fullPrompt += `\n\nAdditional text from the post:\n${textInput}`;
      }

      // Call OpenRouter Vision API
      try {
        aiResponse = await callOpenRouterVisionAPI(
          base64Image,
          fullPrompt,
          openRouterApiKey
        );
      } catch (error) {
        console.error("Autofill vision API error:", error);
        return NextResponse.json(
          {
            error:
              error instanceof Error
                ? error.message
                : "Failed to analyze image with AI",
          },
          { status: 500 }
        );
      }
    }

    // Validate and normalize the response
    const normalizedData: any = {
      title: aiResponse.title || "",
      eventType: aiResponse.eventType || "Battle", // Default to Battle if missing
      dates: Array.isArray(aiResponse.dates) ? aiResponse.dates : [],
      location: aiResponse.location ?? "",
      description: aiResponse.description ?? "",
      schedule: aiResponse.schedule ?? "",
      cost: aiResponse.cost ?? "",
      prize: aiResponse.prize ?? "",
      styles: Array.isArray(aiResponse.styles)
        ? validateDanceStyles(aiResponse.styles)
        : [],
      website: aiResponse.website ?? "",
      instagram: aiResponse.instagram ?? "",
      youtube: aiResponse.youtube ?? "",
      facebook: aiResponse.facebook ?? "",
    };

    // Validate event type
    const validEventTypes = [
      "Battle",
      "Competition",
      "Class",
      "Workshop",
      "Session",
      "Party",
      "Festival",
      "Performance",
      "Other",
    ];
    if (!validEventTypes.includes(normalizedData.eventType)) {
      normalizedData.eventType = "Battle";
    }

    // Normalize dates - ensure MM/DD/YYYY format and handle times
    if (normalizedData.dates && normalizedData.dates.length > 0) {
      normalizedData.dates = normalizedData.dates.map((dateObj: any) => {
        const date = dateObj.date || "";
        const startTime =
          dateObj.startTime && dateObj.startTime.trim()
            ? dateObj.startTime.trim()
            : undefined;
        const endTime =
          dateObj.endTime && dateObj.endTime.trim()
            ? dateObj.endTime.trim()
            : undefined;

        return {
          date,
          isAllDay: !startTime && !endTime,
          startTime,
          endTime,
        };
      });
    } else {
      // Ensure at least one date entry
      normalizedData.dates = [
        {
          date: "",
          isAllDay: true,
          startTime: undefined,
          endTime: undefined,
        },
      ];
    }

    // Normalize social media links
    normalizedData.website =
      normalizedData.website && normalizedData.website.trim()
        ? normalizedData.website.trim()
        : "";
    normalizedData.instagram =
      normalizeInstagram(normalizedData.instagram) || "";
    normalizedData.youtube = normalizeYouTube(normalizedData.youtube) || "";
    normalizedData.facebook = normalizeFacebook(normalizedData.facebook) || "";

    // Convert null/undefined to empty strings for all string fields
    const stringFields = [
      "location",
      "description",
      "schedule",
      "cost",
      "prize",
      "website",
      "instagram",
      "youtube",
      "facebook",
    ];
    for (const field of stringFields) {
      if (
        normalizedData[field] === null ||
        normalizedData[field] === undefined
      ) {
        normalizedData[field] = "";
      }
    }

    // Ensure styles is an array
    if (!Array.isArray(normalizedData.styles)) {
      normalizedData.styles = [];
    }

    return NextResponse.json({
      success: true,
      data: normalizedData,
    });
  } catch (error) {
    console.error("Autofill error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to process autofill request",
      },
      { status: 500 }
    );
  }
}
