"use server";

import { redirect } from "next/navigation";
import { signIn, signOut } from "@/auth";
import { signupUser, updateUser } from "@/db/queries/user";
import { auth } from "@/auth";

export async function signInWithGoogle() {
  const { data, error } = await signIn("google");

  if (error) {
    console.error(error);
    return;
  }

  redirect("/dashboard");
}

export async function signOutAccount() {
  await signOut();
}

export async function signup(formData: FormData) {
  const session = await auth();

  if (!session) {
    console.error("No user session found");
    return;
  }

  console.log(formData);

  if (!formData.get("displayName") || !formData.get("username") || !formData.get("date")) {
    console.error("Missing required fields");
    return;
  }

  const userResult = await signupUser(session.user.id, {
    displayName: formData.get("displayName") as string,
    username: formData.get("username") as string,
    date: formData.get("date") as string,
    auth: formData.get("auth") as string,
  });

  console.log(userResult);

  redirect("/dashboard");
}
