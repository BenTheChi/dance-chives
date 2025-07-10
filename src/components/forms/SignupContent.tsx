"use client";

import { signInWithGoogle } from "@/lib/server_actions/auth_actions";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useAuth } from "@/components/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import SignUpForm from "./signup-form";

export function SignupContent() {
  const { session } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (session?.user.username) {
      router.push("/dashboard");
    }
  }, [session, router]);

  // User is already logged in and registered
  if (session?.user.username) {
    return null;
  }

  // User is neither logged in nor registered, show OAuth options
  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center w-full">
        <h1 className="mb-3 font-bold text-2xl">
          Pick an OAuth Provider for your Login
        </h1>
        <Button className="max-w-xl cursor-pointer" onClick={signInWithGoogle}>
          <Image
            src="/GLogo.svg"
            alt="Google"
            width={20}
            height={20}
            className="mr-1"
          />
          Signup With Google
        </Button>
      </div>
    );
  }

  // If the user is logged in, but not registered show the signup form
  return (
    <div className="flex items-center justify-center w-full">
      <SignUpForm />
    </div>
  );
}
