import { AppNavbar } from "@/components/AppNavbar";
import CompetitionFormWrapper from "@/components/CompetitionFormWrapper";

export default function AddCompetitionPage() {
  return (
    <>
      <AppNavbar />
      <div className="flex flex-col gap-4 p-6 md:px-4">
        <CompetitionFormWrapper />
      </div>
    </>
  );
}

