"use client";

import { useState } from "react";
import { UserCard } from "@/components/UserCard";
import { Switch } from "@/components/ui/switch";
import { UserCardRow } from "@/db/queries/user-cards";

interface ProfilesPageClientProps {
  users: UserCardRow[];
}

export function ProfilesPageClient({ users }: ProfilesPageClientProps) {
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(true);

  const filteredUsers = showVerifiedOnly
    ? users.filter((user) => user.claimed)
    : users;

  return (
    <div className="relative flex-1 flex flex-col">
      {/* Filter Switch */}
      <div className="flex items-center justify-center gap-4 py-4 border-b-2 border-primary-light bg-charcoal">
        <label
          htmlFor="account-filter"
          className="text-sm font-medium cursor-pointer"
        >
          All Accounts
        </label>
        <Switch
          id="account-filter"
          checked={showVerifiedOnly}
          onCheckedChange={setShowVerifiedOnly}
        />
        <label
          htmlFor="account-filter"
          className="text-sm font-medium cursor-pointer"
        >
          Verified Accounts
        </label>
      </div>

      {/* Content */}
      <div className="relative z-10 flex justify-center flex-1 min-h-0 overflow-y-auto">
        <div className="flex flex-col items-center justify-center px-4 py-8 max-w-[1200px] w-full">
          {filteredUsers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-12 overflow-visible">
              {filteredUsers.map((user) => (
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
                {showVerifiedOnly
                  ? "No verified accounts found."
                  : "No users found in the database."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

