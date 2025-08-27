import { auth } from "@/auth";
import { getUser } from "@/db/queries/user";
import ProfileForm from "@/components/forms/profile-form";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/");
  }

  // Get the full user data from database
  const currentUser = await getUser(session.user.id);

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Profile Settings</h1>
      <ProfileForm currentUser={currentUser} />
    </div>
  );
}