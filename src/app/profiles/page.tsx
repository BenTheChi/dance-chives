import { AppNavbar } from "@/components/AppNavbar";
import { getAllUsers } from "@/db/queries/user";
import { UserCard } from "@/components/UserCard";

export default async function ProfilesPage() {
  const users = await getAllUsers();

  return (
    <>
      <AppNavbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">Profiles</h1>
        <p className="text-muted-foreground mb-8">
          Browse all user profiles in the community
        </p>

        {users.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {users.map((user) => (
              <UserCard
                key={user.id}
                displayName={user.displayName}
                username={user.username}
                image={user.image}
                styles={user.styles}
                city={user.city}
              />
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
    </>
  );
}
