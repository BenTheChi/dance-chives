"use server";
import { auth } from "@/auth";
import { uploadToGCloudStorage } from "../GCloud";
import { insertEvent } from "@/db/queries/event";

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
  let posterSrc = "";
  const date = JSON.parse(formData.get("date") as string);

  if (poster instanceof File) {
    const result = await uploadToGCloudStorage(poster);

    if (result.success) {
      posterSrc = result.url || "";
      console.log("Poster uploaded successfully:", posterSrc);
    } else {
      console.error("Failed to upload poster");
      return;
    }
  } else {
    console.error("Poster is not a valid file");
  }

  //TODO Change type to a constant
  const newEvent = {
    creatorId: session?.user.id,
    title: formData.get("eventTitle")?.toString() || "",
    description: formData.get("description")?.toString() || "",
    startDate: date.from,
    endDate: date.to,
    // endDate: formData.get("endDate"),
    address: formData.get("address")?.toString() || "",
    time: formData.get("time")?.toString() || "",
    roles: roles,
    poster: {
      src: posterSrc,
      type: "poster" as "poster",
    },
  };

  console.log(newEvent);

  //At this point collect all the data and upload it to the database
  insertEvent(newEvent)
    .then((res) => {
      console.log("Event added successfully:", res);
    })
    .catch((err) => {
      // If adding the event fails then the poster should be deleted
      console.error("Error adding event:", err);
    });
}
