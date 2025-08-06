"use server";

import { auth } from "@/auth";
import { updateUser } from "@/db/queries/user";
import { uploadToGCloudStorage } from "@/lib/GCloud";
import { revalidatePath } from "next/cache";

export async function updateUserProfile(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  const userId = session.user.id;
  const displayName = formData.get("displayName") as string;
  const bio = formData.get("bio") as string;
  const instagram = formData.get("instagram") as string;
  const website = formData.get("website") as string;
  const city = formData.get("city") as string;
  const profilePicture = formData.get("profilePicture") as File | null;

  // Validate required fields
  if (!displayName?.trim()) {
    throw new Error("Display name is required");
  }

  // Handle profile picture upload if provided
  let profilePictureUrl = typeof session.user.image === "string" ? session.user.image : ""; // Fallback to empty string if undefined
  if (profilePicture && profilePicture.size > 0) {
    try {
      const uploadResults = await uploadToGCloudStorage([profilePicture]);
      if (uploadResults.length > 0) {
        profilePictureUrl = uploadResults[0].url;
      }
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      throw new Error("Failed to upload profile picture");
    }
  }

  // Prepare user update data
  const userUpdateData = {
    displayName: displayName?.trim() || "",
    bio: bio?.trim() || "",
    instagram: instagram?.trim() || "",
    website: website?.trim() || "",
    city: city?.trim() || "",
    image: profilePictureUrl || "",
  };

  try {
    await updateUser(userId, userUpdateData);
    revalidatePath("/profile");
    return { success: true };
  } catch (error) {
    console.error("Error updating user profile:", error);
    throw new Error("Failed to update profile");
  }
} 