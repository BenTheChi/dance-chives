"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FlaskConical } from "lucide-react";

interface TestUser {
  id: string;
  name: string;
  email: string;
  auth: number;
  label: string;
}

const TEST_USERS: TestUser[] = [
  {
    id: "test-user-0",
    name: "Base User",
    email: "base@test.local",
    auth: 0,
    label: "Level 0 - Base User",
  },
  {
    id: "test-user-1",
    name: "Creator",
    email: "creator@test.local",
    auth: 1,
    label: "Level 1 - Creator",
  },
  {
    id: "test-user-2",
    name: "Moderator",
    email: "moderator@test.local",
    auth: 2,
    label: "Level 2 - Moderator",
  },
  {
    id: "test-user-3",
    name: "Admin",
    email: "admin@test.local",
    auth: 3,
    label: "Level 3 - Admin",
  },
  {
    id: "test-user-4",
    name: "Super Admin",
    email: "super-admin@test.local",
    auth: 4,
    label: "Level 4 - Super Admin",
  },
];

export function TestLoginDropdown() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>("");

  // Only render in development
  const isDevelopment = process.env.NODE_ENV === "development";

  if (!isDevelopment) {
    return null;
  }

  const handleTestLogin = async (userId: string) => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      // First verify the user exists via our API
      const response = await fetch("/api/auth/test-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("❌ Test login failed:", error);
        alert(`Test login failed: ${error.error}`);
        return;
      }

      const data = await response.json();
      console.log("✅ User validated:", data.user);

      // Now use NextAuth's signIn with the test-login provider
      const result = await signIn("test-login", {
        userId,
        redirect: false,
      });

      if (result?.error) {
        console.error("❌ SignIn failed:", result.error);
        alert(`Sign in failed: ${result.error}`);
      } else {
        console.log("✅ Test login successful");
        // Check if user is registered and redirect accordingly
        // Use accountVerified from the API response
        if (data.user?.accountVerified) {
          router.push("/dashboard");
        } else {
          router.push("/signup");
        }
      }
    } catch (error) {
      console.error("❌ Test login error:", error);
      alert("Test login failed. Check console for details.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Select
        value={selectedUser}
        onValueChange={setSelectedUser}
        disabled={isLoading}
      >
        <SelectTrigger className="w-[220px]">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-4 w-4" />
            <SelectValue placeholder="Test Login" />
          </div>
        </SelectTrigger>
        <SelectContent>
          {TEST_USERS.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              {user.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        size="sm"
        variant="outline"
        onClick={() => selectedUser && handleTestLogin(selectedUser)}
        disabled={!selectedUser || isLoading}
      >
        {isLoading ? "Logging in..." : "Login"}
      </Button>
    </div>
  );
}
