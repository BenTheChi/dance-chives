"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { signInWithGoogle } from "@/lib/server_actions/auth_actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FlaskConical } from "lucide-react";
import { AppNavbar } from "@/components/AppNavbar";
import { isAccountVerified } from "@/lib/utils/auth-utils-client";

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

export default function LoginPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [testLoginLoading, setTestLoginLoading] = useState(false);
  const [selectedTestUser, setSelectedTestUser] = useState<string>("");

  const isDevelopment = process.env.NODE_ENV === "development";

  useEffect(() => {
    if (session) {
      // Check if user is registered (account verified)
      if (isAccountVerified(session)) {
        router.push("/dashboard");
      } else {
        router.push("/signup");
      }
    }
  }, [session, router]);

  if (session) {
    return null;
  }

  const handleSendMagicLink = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage(null);
    setError(null);

    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch("/api/auth/magic-link/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: trimmed }),
      });

      if (!response.ok) {
        // We still show the same generic success message to avoid enumeration
        console.error("Magic link request failed", await response.text());
      }

      setMessage(
        "If that email exists, we've sent a magic login link. Please check your inbox."
      );
    } catch (err) {
      console.error("Error requesting magic link", err);
      setMessage(
        "If that email exists, we've sent a magic login link. Please check your inbox."
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleTestLogin = async (userId: string) => {
    if (testLoginLoading) return;

    setTestLoginLoading(true);
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
      setTestLoginLoading(false);
    }
  };

  return (
    <>
      <AppNavbar />
      <main className="container mx-auto flex flex-col items-center justify-center min-h-screen">
        <h1 className="mb-6">Login</h1>

        <section className="w-full max-w-md bg-primary border-2 border-black rounded-sm p-5 space-y-6">
          <header>
            <p className="text-center">Sign in with Google email.</p>
          </header>

          <div className="space-y-3">
            <Button
              onClick={signInWithGoogle}
              className="w-full flex items-center justify-center"
            >
              <Image
                src="/GLogo.svg"
                alt="Google"
                width={20}
                height={20}
                className="mr-2"
              />
              Login with Google
            </Button>
          </div>

          <hr className="my-4 border-primary-light" />

          <p className="text-center mb-4">
            Or sign in with a one-time magic link sent to your email.
          </p>

          <form onSubmit={handleSendMagicLink} className="space-y-3">
            <div className="space-y-4">
              <label className="text-sm font-medium" htmlFor="email">
                Email address
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={isSending}
              />
            </div>
            {error && (
              <p className="text-sm text-red-500" role="alert">
                {error}
              </p>
            )}
            {message && !error && (
              <p className="text-sm text-green-600">{message}</p>
            )}
            <Button type="submit" className="w-full" disabled={isSending}>
              {isSending ? "Sending link..." : "Send magic link"}
            </Button>
          </form>

          {isDevelopment && (
            <>
              <hr className="my-4 border-primary-light" />

              <div className="space-y-3">
                <p className="text-center text-sm">Development: Test Login</p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Select
                    value={selectedTestUser}
                    onValueChange={setSelectedTestUser}
                    disabled={testLoginLoading}
                  >
                    <SelectTrigger className="flex-1">
                      <div className="flex items-center gap-2">
                        <FlaskConical className="h-4 w-4" />
                        <SelectValue placeholder="Select test user" />
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
                    variant="outline"
                    onClick={() =>
                      selectedTestUser && handleTestLogin(selectedTestUser)
                    }
                    disabled={!selectedTestUser || testLoginLoading}
                    className="w-full sm:w-auto"
                  >
                    {testLoginLoading ? "Logging in..." : "Test Login"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </section>
      </main>
    </>
  );
}
