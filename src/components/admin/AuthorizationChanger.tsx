"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { AUTH_LEVELS, getAuthLevelName } from "@/lib/utils/auth-utils";
import { UserSearchItem } from "@/types/user";
import { toast } from "sonner";

export function AuthorizationChanger() {
  const [selectedUser, setSelectedUser] = useState<UserSearchItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<UserSearchItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentAuthLevel, setCurrentAuthLevel] = useState<number | null>(null);
  const [selectedAuthLevel, setSelectedAuthLevel] = useState<number | null>(
    null
  );
  const [isFetchingUser, setIsFetchingUser] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const debouncedSearch = useDebounce(searchQuery, 300);

  // Fetch users when debounced search query changes
  useEffect(() => {
    const fetchUsers = async (query: string) => {
      if (!query.trim()) {
        setUsers([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/users?keyword=${encodeURIComponent(query)}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch users");
        }
        const data = await response.json();
        setUsers(data.data || []);
      } catch (error) {
        console.error("Error fetching users:", error);
        toast.error("Failed to fetch users");
        setUsers([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers(debouncedSearch);
  }, [debouncedSearch]);

  // Fetch user's current auth level when user is selected
  const fetchUserAuthLevel = async (username: string) => {
    setIsFetchingUser(true);
    try {
      const response = await fetch(
        `/api/users/${encodeURIComponent(username)}/auth-level`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch user auth level");
      }
      const data = await response.json();
      setCurrentAuthLevel(data.authLevel);
      setSelectedAuthLevel(data.authLevel);
    } catch (error) {
      console.error("Error fetching user auth level:", error);
      toast.error("Failed to fetch user's authorization level");
      setCurrentAuthLevel(null);
    } finally {
      setIsFetchingUser(false);
    }
  };

  // Handle user selection
  const handleUserSelect = (user: UserSearchItem) => {
    setSelectedUser(user);
    setSearchQuery(
      user.displayName
        ? `${user.displayName} (${user.username})`
        : user.username
    );
    setUsers([]);
    fetchUserAuthLevel(user.username);
  };

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    // Clear selected user if search changes
    if (
      selectedUser &&
      value !==
        (selectedUser.displayName
          ? `${selectedUser.displayName} (${selectedUser.username})`
          : selectedUser.username)
    ) {
      setSelectedUser(null);
      setCurrentAuthLevel(null);
      setSelectedAuthLevel(null);
    }
  };

  // Handle auth level update
  const handleUpdateAuthLevel = async () => {
    if (
      !selectedUser ||
      selectedAuthLevel === null ||
      selectedAuthLevel === currentAuthLevel
    ) {
      toast.error("Please select a user and choose a different auth level");
      return;
    }

    if (!selectedUser.id) {
      toast.error("User ID is required. Please refresh and try again.");
      return;
    }

    setIsUpdating(true);
    try {
      const response = await fetch("/api/auth/update-level", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          authLevel: selectedAuthLevel,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to update authorization level");
      }

      toast.success(
        `Successfully updated ${
          selectedUser.displayName || selectedUser.username
        }'s authorization level to ${getAuthLevelName(selectedAuthLevel)}`
      );
      setCurrentAuthLevel(selectedAuthLevel);
    } catch (error) {
      console.error("Error updating auth level:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update authorization level"
      );
    } finally {
      setIsUpdating(false);
    }
  };

  // Auth level options
  const authLevelOptions = Object.entries(AUTH_LEVELS)
    .map(([, value]) => ({
      name: getAuthLevelName(value),
      value,
    }))
    .sort((a, b) => a.value - b.value);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Authorization Level Manager</CardTitle>
        <CardDescription>
          Change user authorization levels (Admin/SuperAdmin only)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* User Search */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Select User</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by username or display name..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9"
            />
            {isLoading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {/* User Dropdown */}
          {users.length > 0 && (
            <div className="border rounded-md bg-white shadow-lg max-h-60 overflow-y-auto z-50">
              {users.map((user) => (
                <div
                  key={user.username}
                  onClick={() => handleUserSelect(user)}
                  className="px-4 py-2 hover:bg-accent cursor-pointer text-sm"
                >
                  {user.displayName
                    ? `${user.displayName} (${user.username})`
                    : user.username}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Current Auth Level Display */}
        {selectedUser && (
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-md">
              <div className="text-sm font-medium">
                {selectedUser.displayName || selectedUser.username}
              </div>
              {isFetchingUser ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Loading current authorization level...
                </div>
              ) : currentAuthLevel !== null ? (
                <div className="text-sm text-muted-foreground mt-1">
                  Current Level:{" "}
                  <span className="font-medium">
                    {getAuthLevelName(currentAuthLevel)} ({currentAuthLevel})
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-destructive mt-1">
                  <AlertCircle className="h-3 w-3" />
                  Failed to load authorization level
                </div>
              )}
            </div>

            {/* Auth Level Selector */}
            {currentAuthLevel !== null && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  New Authorization Level
                </label>
                <Select
                  value={
                    selectedAuthLevel !== null
                      ? selectedAuthLevel.toString()
                      : ""
                  }
                  onValueChange={(value) =>
                    setSelectedAuthLevel(parseInt(value))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select authorization level" />
                  </SelectTrigger>
                  <SelectContent>
                    {authLevelOptions.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value.toString()}
                      >
                        {option.name} ({option.value})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Update Button */}
            {currentAuthLevel !== null &&
              selectedAuthLevel !== null &&
              selectedAuthLevel !== currentAuthLevel && (
                <Button
                  onClick={handleUpdateAuthLevel}
                  disabled={isUpdating}
                  className="w-full"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Update Authorization Level
                    </>
                  )}
                </Button>
              )}

            {currentAuthLevel !== null &&
              selectedAuthLevel === currentAuthLevel && (
                <div className="text-sm text-muted-foreground text-center py-2">
                  Selected level is the same as current level
                </div>
              )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
