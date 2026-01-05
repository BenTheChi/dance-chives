import { AppNavbar } from "@/components/AppNavbar";
import { getUserCards } from "@/db/queries/user-cards";
import { UserCard } from "@/components/UserCard";

export default async function ProfilesPage() {
  const users = await getUserCards();

  return (
    <>
      <div className="flex flex-col">
        <AppNavbar />
        <h1 className="py-7 border-b-2 border-primary-light bg-charcoal">
          Profiles
        </h1>
        <div className="relative flex-1 flex flex-col">
          {/* Content */}
          <div className="relative z-10 flex justify-center flex-1 min-h-0 overflow-y-auto">
            <div className="flex flex-col items-center justify-center px-4 py-8 max-w-[1200px] w-full">
              {users.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-12 overflow-visible">
                  {users.map((user) => (
                    <div key={user.id} className="overflow-visible">
                      <UserCard
                        displayName={user.displayName}
                        username={user.username}
                        image={user.image ?? undefined}
                        styles={user.styles}
                        city={user.city}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    No users found in the database.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
