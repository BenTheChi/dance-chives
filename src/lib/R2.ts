import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import crypto from "crypto";
import { getUser } from "@/db/queries/user";
import { getActualEnvironment } from "@/lib/config";

type ImageType = "user-profile" | "event-poster" | "event-gallery";

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
  // Call environment detection function directly to ensure we get the latest values
  // This properly handles VERCEL_ENV, NODE_ENV, and APP_ENV
  const env = getActualEnvironment();

  // Check staging first, then production, default to staging (safer)
  let bucket: string;
  if (env === "staging") {
    bucket = "dance-chives-images-staging";
  } else if (env === "production") {
    bucket = "dance-chives-images-production";
  } else {
    // Development or unknown - default to staging for safety
    bucket = "dance-chives-images-staging";
  }

  // Log bucket selection for debugging (only log once per module load)
  if (
    !(globalThis as unknown as { __r2BucketLogged: boolean }).__r2BucketLogged
  ) {
    console.log("🪣 [R2] Bucket selection:", {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
      APP_ENV: process.env.APP_ENV,
      detectedEnv: env,
      selectedBucket: bucket,
    });
    (globalThis as unknown as { __r2BucketLogged: boolean }).__r2BucketLogged =
      true;
  }

  return bucket;
}

// Generate organizational path for R2 storage
function generateR2Path(
  type: ImageType,
  entityId: string,
  filename: string
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
  entityId: string
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
    const key = generateR2Path(type, entityId, file.name);
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
    // URL format: https://pub-xxxxx.r2.dev/users/{username}/profile-pictures/uuid-filename.jpg
    // Note: Username is used in the path (not user id) as it's the public-facing identifier
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

/**
 * Helper function to convert user id to username if needed.
 * Username should be used for R2 paths as it's the public-facing identifier.
 * This function is provided for cases where only id is available.
 */
async function getUsernameFromId(userIdOrUsername: string): Promise<string> {
  // If it looks like a UUID (typical user id format), try to fetch username
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(userIdOrUsername)) {
    try {
      const user = await getUser(userIdOrUsername);
      if (user?.username) {
        return user.username;
      }
    } catch (error) {
      console.error(
        `Failed to convert user id to username: ${userIdOrUsername}`,
        error
      );
    }
  }
  // If it's not a UUID or conversion failed, assume it's already a username
  return userIdOrUsername;
}

/**
 * Upload user profile picture to R2 storage.
 * Uses username for the R2 path (public-facing identifier).
 * Note: User id should only be used internally and never exposed in R2 paths.
 *
 * @param file - The image file to upload
 * @param username - The user's username (public identifier). If a user id is passed,
 *                   it will be automatically converted to username.
 */
export async function uploadProfilePictureToR2(
  file: File,
  username: string
): Promise<{ success: boolean; url?: string; id?: string }> {
  // Convert id to username if needed (for backward compatibility and safety)
  const resolvedUsername = await getUsernameFromId(username);
  return uploadToR2(file, "user-profile", resolvedUsername);
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
