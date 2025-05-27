"use client";
import SignUpForm from "@/components/forms/signup-form";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { signInWithGoogle } from "@/lib/server_actions/auth_actions";
import Image from "next/image";
import { redirect } from "next/navigation";

export default async function SignupPage() {
    const { session } = useAuth();

    //The user is neither logged in nor registered, show the OAuth options then let them redirect back to this page where they will be shown the rest of the signup form
    if (!session) {
        return (
            <div className="flex flex-col items-center justify-center w-full">
                <h1 className="mb-3 font-bold text-2xl">
                    Pick an OAuth Provider for your Login
                </h1>
                <Button
                    className="max-w-xl cursor-pointer"
                    onClick={signInWithGoogle}
                >
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

    //User is already logged in and registered
    if (session.user.username) {
        redirect("/dashboard");
    }

    //If the user is logged in, but not registered show the signup form
    return (
        <div className="flex items-center justify-center w-full">
            <SignUpForm user={session.user} />
        </div>
    );
}
