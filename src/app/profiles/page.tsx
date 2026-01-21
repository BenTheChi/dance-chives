import { getUserCards } from "@/db/queries/user-cards";
import { ProfilesPageClient } from "@/components/ProfilesPageClient";

// Enable ISR with 12-hour revalidation (comprehensive on-demand revalidation covers most updates)
export const revalidate = 43200; // Revalidate every 12 hours

export default async function ProfilesPage() {
  const users = await getUserCards();

  return (
    <>
      <div className="flex flex-col">
        <h1 className="py-7 border-b-2 border-primary-light bg-charcoal">
          Profiles
        </h1>
        <ProfilesPageClient users={users} />
      </div>
    </>
  );
}
