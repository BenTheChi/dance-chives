import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { getUser } from "@/db/queries/user";
import Link from "next/link";

export default async function Home() {
  const session = await auth();

  if (!session) {
    return <div>Not logged in</div>;
  }

  const result = await getUser(session?.user.id);

  console.log(result);

  return (
    <main>
      <header>
        <h1>Home</h1>
        <Link href="/add-event">
          <Button>Add Event</Button>
        </Link>
      </header>
      <section>Content here</section>
    </main>
  );
}
