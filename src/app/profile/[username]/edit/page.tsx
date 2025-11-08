import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getUserProfile } from "@/lib/server_actions/auth_actions";
import { AppNavbar } from "@/components/AppNavbar";
import { AccountVerificationGuard } from "@/components/AccountVerificationGuard";
import SignUpForm from "@/components/forms/signup-form";
import { AUTH_LEVELS } from "@/lib/utils/auth-utils";

interface PageProps {
  params: Promise<{ username: string }>;
}

export default async function EditProfilePage({ params }: PageProps) {
  const paramResult = await params;
  const username = paramResult.username;

  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const profileResult = await getUserProfile(username);

  if (!profileResult.success || !profileResult.profile) {
    notFound();
  }

  const profile = profileResult.profile;

  // Users can only edit their own profile (unless admin)
  const userAuthLevel = session.user.auth || 0;
  const isOwnProfile = session.user.id === profile.id;
  const isAdmin = userAuthLevel >= AUTH_LEVELS.ADMIN;

  if (!isOwnProfile && !isAdmin) {
    redirect("/dashboard");
  }

  // Format date for the form (convert from Date to MM/DD/YYYY if needed)
  let formattedDate = "";
  if (profile.date) {
    const dateObj =
      typeof profile.date === "string" ? new Date(profile.date) : profile.date;
    if (!isNaN(dateObj.getTime())) {
      const month = String(dateObj.getMonth() + 1).padStart(2, "0");
      const day = String(dateObj.getDate()).padStart(2, "0");
      const year = dateObj.getFullYear();
      formattedDate = `${month}/${day}/${year}`;
    } else {
      formattedDate = profile.date as string;
    }
  }

  return (
    <AccountVerificationGuard requireVerification={true}>
      <AppNavbar />
      <main className="flex justify-center items-center mt-10">
        <SignUpForm
          isEditMode={true}
          currentUser={{
            displayName: profile.displayName,
            username: profile.username,
            bio: profile.bio,
            instagram: profile.instagram,
            website: profile.website,
            city: profile.city,
            date: formattedDate,
            styles: profile.styles,
            image: profile.image,
          }}
          userId={profile.id}
        />
      </main>
    </AccountVerificationGuard>
  );
}
