"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { signIn, signOut } from "@/auth";

export async function login(formData: FormData) {
  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error } = await signIn("credentials", {
    email: data.email,
    password: data.password,
  });

  if (error) {
    console.error(error);
    return;
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signInWithGoogle() {
  const { error } = await signIn("google");

  if (error) {
    console.error(error);
    return;
  }

  redirect("/dashboard");
}

export async function signOutAccount() {
  await signOut();
}
