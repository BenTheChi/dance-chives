import { AppNavbar } from "@/components/AppNavbar";
import WorkshopFormWrapper from "@/components/WorkshopFormWrapper";

export default function AddWorkshopPage() {
  return (
    <>
      <AppNavbar />
      <div className="flex flex-col gap-4 p-6 md:px-4">
        <WorkshopFormWrapper />
      </div>
    </>
  );
}
