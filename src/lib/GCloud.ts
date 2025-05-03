import { Storage } from "@google-cloud/storage";

export async function uploadToGCloudStorage(
  file: File
): Promise<{ success: boolean; url?: string }> {
  const storage = new Storage();
  const uniqueFileName = `${crypto.randomUUID()}-${file.name}`;

  try {
    const data = await storage
      .bucket("dance-chives-posters")
      .file(uniqueFileName)
      .save(Buffer.from(await file.arrayBuffer()));

    return {
      success: true,
      url: `https://storage.googleapis.com/dance-chives-posters/${uniqueFileName}`,
    };
  } catch (error) {
    console.error("Error uploading file to GCloud Storage:", error);
    return { success: false };
  }
}
