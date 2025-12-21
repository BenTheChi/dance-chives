import { SignupContent } from "@/components/forms/SignupContent";
import { AppNavbar } from "@/components/AppNavbar";

export default function SignupPage() {
  return (
    <>
      <AppNavbar />
      <main className="container mx-auto flex flex-col items-center justify-center min-h-screen">
        <SignupContent />
      </main>
    </>
  );
}
