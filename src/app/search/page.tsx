import { AppNavbar } from "@/components/AppNavbar";
import { UnderConstruction } from "@/components/UnderConstruction";

export default function SearchPage() {
  return (
    <>
      <AppNavbar />
      <UnderConstruction
        title="Search"
        message="Search feature is coming soon!  If you have any suggestions, please use the feedback form flag in the navbar."
      />
    </>
  );
}
