"use server";
import { auth } from "@/auth";
import { uploadToGCloudStorage } from "../GCloud";

export async function addEvent(formData: FormData) {
  const session = await auth();
  let roles = [];

  if (!session) {
    console.error("No user session found");
    return;
  }

  if (formData.get("roles")) {
    roles = formData.get("roles")
      ? JSON.parse(formData.get("roles") as string)
      : [];
  }

  if (!formData.get("poster")) {
    console.error("No poster found");
    return;
  }
  if (!formData.get("eventTitle") || !formData.get("date")) {
    console.error("Missing required fields");
    return;
  }

  const poster = formData.get("poster");

  if (poster instanceof File) {
    await uploadToGCloudStorage(poster);
  } else {
    console.error("Poster is not a valid file");
  }

  //At this point collect all the data and upload it to the database
}
