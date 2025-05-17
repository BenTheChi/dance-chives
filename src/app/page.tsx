import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { getUser } from "@/db/queries/user";
import Link from "next/link";
import SearchFilterBar from "../components/SearchFilterBar";
import Hcard from "../components/cards";

export default async function Home() {
  const session = await auth();

  if (!session?.user?.id) {
    return <div>Not logged in or user ID missing</div>;
  }

  const result = await getUser(session.user.id);

  console.log(result);

  return (
    <main>
      <header>
        <SearchFilterBar />
      </header>

      

      <div className="flex flex-wrap gap-3">
      <div className="bg-white shadow-md border-3 border-gray-300
 rounded-md mt-4 mb-2 ml-0 mr-0 w-70 h-40 flex overflow-hidden justify-center items-center flex-col">
        <Link href="/add-event">
          <Button>Add Event</Button>
        </Link>
        <section>Content here</section>
      </div>
        <Hcard
          events="B-GIRL-CITY-XIII"
          organisation ="Part of BGirlcity"
          imageUrl = "cardimage.jpeg.png"
          date = "12/1/2025 - 14/1/2025"
          city = "Houston, TX"
          statuss = "breaking"
          />
          <Hcard
          events="B-GIRL-CITY-XIII"
          organisation ="Part of BGirlcity"
          imageUrl = "cardimage.jpeg.png"
          date = "12/1/2025 - 14/1/2025"
          city = "Houston, TX"
          statuss = "breaking"
          />
          <Hcard
          events="B-GIRL-CITY-XIII"
          organisation ="Part of BGirlcity"
          imageUrl = "cardimage.jpeg.png"
          date = "12/1/2025 - 14/1/2025"
          city = "Houston, TX"
          statuss = "breaking"
          />
          <Hcard
          events="B-GIRL-CITY-XIII"
          organisation ="Part of BGirlcity"
          imageUrl = "cardimage.jpeg.png"
          date = "12/1/2025 - 14/1/2025"
          city = "Houston, TX"
          statuss = "breaking"
          />
          <Hcard
          events="B-GIRL-CITY-XIII"
          organisation ="Part of BGirlcity"
          imageUrl = "cardimage.jpeg.png"
          date = "12/1/2025 - 14/1/2025"
          city = "Houston, TX"
          statuss = "breaking"
          />
          <Hcard
          events="B-GIRL-CITY-XIII"
          organisation ="Part of BGirlcity"
          imageUrl = "cardimage.jpeg.png"
          date = "12/1/2025 - 14/1/2025"
          city = "Houston, TX"
          statuss = "breaking"
          />
          <Hcard
          events="B-GIRL-CITY-XIII"
          organisation ="Part of BGirlcity"
          imageUrl = "cardimage.jpeg.png"
          date = "12/1/2025 - 14/1/2025"
          city = "Houston, TX"
          statuss = "breaking"
          />
          <Hcard
          events="B-GIRL-CITY-XIII"
          organisation ="Part of BGirlcity"
          imageUrl = "cardimage.jpeg.png"
          date = "12/1/2025 - 14/1/2025"
          city = "Houston, TX"
          statuss = "breaking"
          />
      </div>
    </main>
  );
}
