import { Storage } from "@google-cloud/storage";

export async function uploadToGCloudStorage(
  files: File[]
): Promise<Array<{ success: boolean; url?: string; id?: string }>> {
  const storage = new Storage();

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
  const storage = new Storage();
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
