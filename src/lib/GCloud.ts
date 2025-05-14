import { Storage } from "@google-cloud/storage";

export async function uploadToGCloudStorage(file: File): Promise<boolean> {
  const storage = new Storage();

  console.log(file);

  try {
    const data = await storage
      .bucket("dance-chives-posters")
      .file(file.name)
      .save(Buffer.from(await file.arrayBuffer()));

    console.log("File data:", data);
  } catch (error) {
    console.error("Error uploading file to GCloud Storage:", error);
    return false;
  }

  return true;
}
