import { signInWithGoogle } from "@/lib/server_actions/auth_actions";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function LoginPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
                <h1 className="text-2xl font-bold text-center mb-6">Login</h1>
                <div className="mt-4 text-center">
                    <Button
                        onClick={signInWithGoogle}
                        className="mt-2 w-full flex items-center justify-center"
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
            </div>
        </div>
    );
}
