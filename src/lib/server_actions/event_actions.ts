"use server";
import { auth } from "@/auth";
import { uploadToGCloudStorage } from "../GCloud";
import { insertEvent } from "@/db/queries/event";
import { City } from "@/types/event";

interface addEventProps {
  title: string;
  city: City;
  address?: string;
  date: { from: Date; to: Date };
  time?: string;
  description?: string;
  entryCost?: string;
  prize?: string;
  poster?: File;
  roles?: {
    member: string;
    role: string;
  }[];
}

export async function addEvent(props: addEventProps) {
  const session = await auth();

  if (!session) {
    console.error("No user session found");
    return;
  }

  if (!props.poster) {
    console.error("No poster found");
    return;
  }

  if (!props.title || !props.date) {
    console.error("Missing required fields");
    return;
  }

  const poster = props.poster;
  let posterSrc = "";
  let posterId = "";
  const date = props.date;

  if (poster instanceof File) {
    const result = await uploadToGCloudStorage(poster);

    if (result.success) {
      posterSrc = result.url || "";
      posterId = result.id || "";
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
    title: props.title,
    description: props.description || "",
    startDate: date.from,
    endDate: date.to,
    address: props.address || "",
    time: props.time || "",
    roles: props.roles || [],
    poster: {
      id: posterId,
      title: (poster as File).name,
      src: posterSrc,
      type: "poster" as "poster",
    },
    city: props.city,
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
