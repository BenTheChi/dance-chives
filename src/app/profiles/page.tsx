import { AppNavbar } from "@/components/AppNavbar";
import { getUserCards } from "@/db/queries/user-cards";
import { ProfilesPageClient } from "@/components/ProfilesPageClient";

export default async function ProfilesPage() {
  const users = await getUserCards();

  return (
    <>
      <div className="flex flex-col">
        <AppNavbar />
        <h1 className="py-7 border-b-2 border-primary-light bg-charcoal">
          Profiles
        </h1>
        <ProfilesPageClient users={users} />
      </div>
    </>
  );
}
