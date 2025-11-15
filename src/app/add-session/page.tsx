import { AppNavbar } from "@/components/AppNavbar";
import SessionFormWrapper from "@/components/SessionFormWrapper";

export default function AddSessionPage() {
  return (
    <>
      <AppNavbar />
      <div className="flex flex-col gap-4 p-6 md:px-4">
        <SessionFormWrapper />
      </div>
    </>
  );
}

