import { Storage } from "@google-cloud/storage";
import crypto from "crypto";

// Initialize Google Cloud Storage with base64-encoded service account
function initializeStorage() {
  const serviceAccountB64 = process.env.GCP_SERVICE_ACCOUNT_B64;

  if (!serviceAccountB64) {
    throw new Error("GCP_SERVICE_ACCOUNT_B64 environment variable is not set");
  }

  try {
    // Decode the base64 service account key
    const serviceAccountKey = JSON.parse(
      Buffer.from(serviceAccountB64, "base64").toString("utf-8")
    );

    // Initialize Storage with explicit credentials
    return new Storage({
      credentials: serviceAccountKey,
      projectId: serviceAccountKey.project_id,
    });
  } catch (error) {
    throw new Error(`Failed to initialize Google Cloud Storage: ${error}`);
  }
}

export async function uploadToGCloudStorage(
  files: File[]
): Promise<Array<{ success: boolean; url?: string; id?: string }>> {
  const storage = initializeStorage();

  const uploadPromises = files.map(async (file) => {
    const id = crypto.randomUUID();
    const uniqueFileName = `${id}-${file.name}`;

    try {
      // Convert File to Buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      await storage
        .bucket("dance-chives-posters")
        .file(uniqueFileName)
        .save(buffer);

      return {
        id: id,
        success: true,
        url: `https://storage.googleapis.com/dance-chives-posters/${uniqueFileName}`,
      };
    } catch (error) {
      console.error(
        `Error uploading file ${file.name} to GCloud Storage:`,
        error
      );
      return { success: false };
    }
  });

  return Promise.all(uploadPromises);
}

export async function deleteFromGCloudStorage(url: string): Promise<boolean> {
  const storage = initializeStorage();
  const bucket = storage.bucket("dance-chives-posters");
  const file = bucket.file(url.split("/").pop()!);

  try {
    await file.delete();
    return true;
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error deleting file from GCloud Storage:", error.message);
    } else {
      console.error("Error deleting file from GCloud Storage:", error);
    }

    return false;
  }
}

export async function uploadProfilePictureToGCloudStorage(
  file: File
): Promise<{ success: boolean; url?: string; id?: string }> {
  const storage = initializeStorage();
  const id = crypto.randomUUID();
  const uniqueFileName = `${id}-${file.name}`;

  try {
    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await storage
      .bucket("dance-chives-profile-pics")
      .file(uniqueFileName)
      .save(buffer);

    return {
      id: id,
      success: true,
      url: `https://storage.googleapis.com/dance-chives-profile-pics/${uniqueFileName}`,
    };
  } catch (error) {
    console.error(
      `Error uploading profile picture ${file.name} to GCloud Storage:`,
      error
    );
    return { success: false };
  }
}
