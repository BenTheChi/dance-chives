import { SignupContent } from "@/components/forms/SignupContent";
import { AppNavbar } from "@/components/AppNavbar";

export default function SignupPage() {
  return (
    <>
      <AppNavbar />
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <SignupContent />
      </div>
    </>
  );
}
