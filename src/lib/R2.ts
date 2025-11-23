import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import crypto from "crypto";

type ImageType =
  | "user-profile"
  | "event-poster"
  | "event-gallery"
  | "workshop-poster"
  | "workshop-gallery"
  | "session-poster"
  | "session-gallery";

// Initialize R2 client with credentials from environment variables
function initializeR2Client(): S3Client {
  const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "R2 credentials not configured. Check environment variables."
    );
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

// Get bucket name based on environment
function getBucketName(): string {
  const isProduction = process.env.NODE_ENV === "production";
  return isProduction
    ? "dance-chives-images-production"
    : "dance-chives-images-staging";
}

// Generate organizational path for R2 storage
function generateR2Path(
  type: ImageType,
  entityId: string,
  filename: string,
  subEntityId?: string
): string {
  const id = crypto.randomUUID();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
  const uniqueFilename = `${id}-${sanitizedFilename}`;

  switch (type) {
    case "user-profile":
      return `users/${entityId}/profile-pictures/${uniqueFilename}`;
    case "event-poster":
      return `events/${entityId}/posters/${uniqueFilename}`;
    case "event-gallery":
      return `events/${entityId}/gallery/${uniqueFilename}`;
    // Legacy types - map to generic events path for unified event system
    default:
      throw new Error(`Unknown image type: ${type}`);
  }
}

// Core upload function
async function uploadToR2(
  file: File,
  type: ImageType,
  entityId: string,
  subEntityId?: string
): Promise<{ success: boolean; url?: string; id?: string }> {
  const client = initializeR2Client();
  const bucket = getBucketName();
  const publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL;

  if (!publicUrl) {
    throw new Error("CLOUDFLARE_R2_PUBLIC_URL not configured");
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const key = generateR2Path(type, entityId, file.name, subEntityId);
    const id = key.split("/").pop()?.split("-")[0] || crypto.randomUUID();

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: file.type || "image/jpeg",
        // Note: R2 may use different ACL model, may need bucket policy instead
        // ACL: "public-read",
      })
    );

    // Construct public URL
    const url = publicUrl.endsWith("/")
      ? `${publicUrl}${key}`
      : `${publicUrl}/${key}`;
    return { success: true, url, id };
  } catch (error) {
    console.error(`Error uploading to R2:`, error);
    return { success: false };
  }
}

// Core delete function
export async function deleteFromR2(url: string): Promise<boolean> {
  const client = initializeR2Client();
  const bucket = getBucketName();
  const publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL;

  if (!publicUrl) {
    throw new Error("CLOUDFLARE_R2_PUBLIC_URL not configured");
  }

  try {
    // Extract key from URL
    // URL format: https://pub-xxxxx.r2.dev/users/123/profile-pictures/uuid-filename.jpg
    const urlObj = new URL(url);
    const key = urlObj.pathname.startsWith("/")
      ? urlObj.pathname.slice(1)
      : urlObj.pathname;

    await client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );

    return true;
  } catch (error) {
    console.error(`Error deleting from R2:`, error);
    return false;
  }
}

// User profile pictures
export async function uploadProfilePictureToR2(
  file: File,
  userId: string
): Promise<{ success: boolean; url?: string; id?: string }> {
  return uploadToR2(file, "user-profile", userId);
}

// Event posters
export async function uploadEventPosterToR2(
  file: File,
  eventId: string
): Promise<{ success: boolean; url?: string; id?: string }> {
  return uploadToR2(file, "event-poster", eventId);
}

// Event gallery
export async function uploadEventGalleryToR2(
  files: File[],
  eventId: string
): Promise<Array<{ success: boolean; url?: string; id?: string }>> {
  return Promise.all(
    files.map((file) => uploadToR2(file, "event-gallery", eventId))
  );
}

// Workshop posters
export async function uploadWorkshopPosterToR2(
  file: File,
  workshopId: string
): Promise<{ success: boolean; url?: string; id?: string }> {
  return uploadToR2(file, "workshop-poster", workshopId);
}

// Workshop gallery
export async function uploadWorkshopGalleryToR2(
  files: File[],
  workshopId: string
): Promise<Array<{ success: boolean; url?: string; id?: string }>> {
  return Promise.all(
    files.map((file) => uploadToR2(file, "workshop-gallery", workshopId))
  );
}

// Session posters
export async function uploadSessionPosterToR2(
  file: File,
  sessionId: string
): Promise<{ success: boolean; url?: string; id?: string }> {
  return uploadToR2(file, "session-poster", sessionId);
}

// Session gallery
export async function uploadSessionGalleryToR2(
  files: File[],
  sessionId: string
): Promise<Array<{ success: boolean; url?: string; id?: string }>> {
  return Promise.all(
    files.map((file) => uploadToR2(file, "session-gallery", sessionId))
  );
}
